-- Order chat: messages exchanged between client/driver/admin for a given order.

CREATE TABLE IF NOT EXISTS app_data.order_messages (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL REFERENCES app_data.taxi_orders(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('client','driver','admin')),
    sender_id   INTEGER,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON app_data.order_messages(order_id, created_at);
