-- Per-order payment ledger, backing the admin Payments page. Every completed
-- order gets exactly one row here (inserted by orderModel.updateOrderStatus),
-- with room for the admin to mark it refunded.

CREATE TABLE IF NOT EXISTS app_data.payments (
    id           SERIAL PRIMARY KEY,
    order_id     INTEGER NOT NULL REFERENCES app_data.taxi_orders(id),
    user_id      INTEGER REFERENCES app_data.users(id),
    taxi_id      INTEGER REFERENCES app_data.taxies(id),
    amount       NUMERIC NOT NULL,
    payment_type TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded')),
    refund_note  TEXT,
    refunded_at  TIMESTAMPTZ,
    refunded_by  INTEGER REFERENCES app_data.admin_users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_idx ON app_data.payments(order_id);
CREATE INDEX IF NOT EXISTS payments_taxi_id_idx ON app_data.payments(taxi_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON app_data.payments(status);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON app_data.payments(created_at);

-- Backfill: give already-completed orders a payment row too, so the page
-- isn't empty and historical revenue lines up with the new ledger.
INSERT INTO app_data.payments (order_id, user_id, taxi_id, amount, payment_type, status, created_at)
SELECT o.id, o.user_id, o.taxi_id, o.total_price, o.payment_type, 'paid', o.updated_at
FROM app_data.taxi_orders o
WHERE o.status = 'completed' AND o.total_price IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM app_data.payments p WHERE p.order_id = o.id);
