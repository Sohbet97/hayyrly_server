-- Per-city commission percentage — the cut taken from a driver's earnings
-- on each completed ride. Deducted from the driver's balance on order completion.

ALTER TABLE app_data.pricing_config
    ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2) NOT NULL DEFAULT 15;
