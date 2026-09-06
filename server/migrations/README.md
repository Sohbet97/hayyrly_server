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
psql "$DATABASE_URL" -f migrations/005_admin_settings.sql
psql "$DATABASE_URL" -f migrations/006_payments.sql
psql "$DATABASE_URL" -f migrations/007_users_block.sql
psql "$DATABASE_URL" -f migrations/008_order_messages.sql
psql "$DATABASE_URL" -f migrations/009_order_reviews.sql
psql "$DATABASE_URL" -f migrations/010_sos_alerts.sql
psql "$DATABASE_URL" -f migrations/011_balance_requests.sql
psql "$DATABASE_URL" -f migrations/012_users_city.sql
psql "$DATABASE_URL" -f migrations/013_support_messages.sql
psql "$DATABASE_URL" -f migrations/014_pricing_commission.sql
psql "$DATABASE_URL" -f migrations/015_balance_allow_negative.sql
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
