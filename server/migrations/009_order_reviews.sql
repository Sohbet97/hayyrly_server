-- Order reviews: client rates a completed order (one review per order).

CREATE TABLE IF NOT EXISTS app_data.order_reviews (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL UNIQUE REFERENCES app_data.taxi_orders(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES app_data.users(id),
    taxi_id     INTEGER NOT NULL REFERENCES app_data.taxies(id),
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_reviews_taxi_id ON app_data.order_reviews(taxi_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_reviews_user_id ON app_data.order_reviews(user_id, created_at);
