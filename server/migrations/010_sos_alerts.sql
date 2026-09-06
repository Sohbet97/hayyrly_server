-- SOS alerts: passenger/driver emergency trigger, reviewed manually by an admin operator.

CREATE TABLE IF NOT EXISTS app_data.sos_alerts (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER REFERENCES app_data.taxi_orders(id) ON DELETE SET NULL,
    user_id     INTEGER REFERENCES app_data.users(id),
    taxi_id     INTEGER REFERENCES app_data.taxies(id),
    phone       TEXT NOT NULL,
    note        TEXT,
    location    geography(Point, 4326) NOT NULL,
    status      TEXT NOT NULL DEFAULT 'open', -- open | acknowledged | resolved
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON app_data.sos_alerts(status, created_at);
