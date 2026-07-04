# Migrations

Hand-written raw SQL, applied manually — there is no migration runner or `sequelize-cli` in
this project (schema is otherwise managed externally, per `server/CLAUDE.md`). Sequelize
never calls `sync()`; it only maps onto tables that already exist.

Apply in order, once, against the target database:

```bash
psql "$DATABASE_URL" -f migrations/001_pricing_config.sql
psql "$DATABASE_URL" -f migrations/002_driver_applications.sql
psql "$DATABASE_URL" -f migrations/003_users_role.sql
psql "$DATABASE_URL" -f migrations/004_admin_users.sql
```

Or, using the discrete `DB_*` env vars already required by the app:

```bash
for f in migrations/0*.sql; do
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f"
done
```

All statements are `IF NOT EXISTS` / idempotent-safe to re-run.

After running these, seed at least one admin login:

```bash
node scripts/createAdmin.js "+99361000000" "some-strong-password" "Admin Name" admin
```
