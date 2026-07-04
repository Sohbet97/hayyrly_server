-- PLAN.md §3.3 — driver signup applications queue, reviewed from the admin panel.

CREATE TABLE IF NOT EXISTS app_data.driver_applications (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES app_data.users(id),
    city_id         INT REFERENCES app_data.cities(id),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    phone           TEXT NOT NULL,
    birthday        DATE,
    auto_number     TEXT,
    marka_id        INT,
    model_id        INT,
    auto_year       INT,
    license_photo   TEXT,   -- URL/path
    car_image       TEXT,
    park            TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    rejection_reason TEXT,
    reviewed_by     INT REFERENCES app_data.users(id),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON app_data.driver_applications (status);
