-- PLAN.md §3.1 — per-city pricing config, editable from the admin panel.
-- Replaces the ORDER_BASE_PRICE / ORDER_PRICE_PER_KM env vars as the source of truth.

CREATE TABLE IF NOT EXISTS app_data.pricing_config (
    id              SERIAL PRIMARY KEY,
    city_id         INT REFERENCES app_data.cities(id) ON DELETE CASCADE,
    base_price      NUMERIC(10,2) NOT NULL DEFAULT 10,
    price_per_km    NUMERIC(10,2) NOT NULL DEFAULT 2.5,
    free_wait_min   NUMERIC(5,2)  NOT NULL DEFAULT 3,
    wait_price_min  NUMERIC(10,2) NOT NULL DEFAULT 0.5,
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by      INT REFERENCES app_data.users(id),
    UNIQUE (city_id)
);

-- Seed a default row for each existing city that doesn't have one yet.
INSERT INTO app_data.pricing_config (city_id, base_price, price_per_km, free_wait_min, wait_price_min)
SELECT id, 10, 2.5, 3, 0.5
FROM app_data.cities c
WHERE NOT EXISTS (SELECT 1 FROM app_data.pricing_config pc WHERE pc.city_id = c.id);
