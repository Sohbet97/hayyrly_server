# Running migration 014 — pricing commission

Adds `commission_percent` (NUMERIC(5,2), default 15) to `app_data.pricing_config`. Idempotent
(`ADD COLUMN IF NOT EXISTS`) — safe to re-run.

## Prerequisites

- Migrations 001–013 already applied (this depends on `001_pricing_config.sql` having created
  the table).
- `DATABASE_URL`, or the discrete `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
  env vars, pointing at the target database.

## Run it

Using a full connection string:

```bash
cd server
psql "$DATABASE_URL" -f migrations/014_pricing_commission.sql
```

Using the discrete `DB_*` env vars (same pattern as the other migrations, per
`migrations/README.md`):

```bash
cd server
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f migrations/014_pricing_commission.sql
```

Expected output: `ALTER TABLE`.

## Verify

```bash
psql "$DATABASE_URL" -c "\d app_data.pricing_config"
```

Confirm `commission_percent` appears as `numeric(5,2) not null default 15`. Existing rows are
backfilled to `15` automatically by the `DEFAULT` clause — no separate `UPDATE` is needed.

Then confirm the API surfaces it:

```bash
curl -s http://localhost:3000/api/pricing/<cityId> | jq
```

## Rollback (if needed)

Not idempotent-safe to re-add after — only run if reverting the feature entirely:

```bash
psql "$DATABASE_URL" -c "ALTER TABLE app_data.pricing_config DROP COLUMN IF EXISTS commission_percent;"
```
