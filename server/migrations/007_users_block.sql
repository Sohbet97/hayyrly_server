-- Admin "Clients" page — ability to block a client from placing new orders.
-- Enforced at order-creation time only (existing sessions/browsing are unaffected).

ALTER TABLE app_data.users
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
