-- Company-wide settings (singleton row) + per-admin notification preferences,
-- backing the previously-unpersisted Settings page (Company/Locale/Notifications sections).

CREATE TABLE IF NOT EXISTS app_data.admin_settings (
    id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    company_name    TEXT NOT NULL DEFAULT 'Hayyrly Taxi',
    support_phone   TEXT NOT NULL DEFAULT '65 80-12-00',
    timezone        TEXT NOT NULL DEFAULT '(GMT+5) Aşgabat',
    default_lang     TEXT NOT NULL DEFAULT 'tk' CHECK (default_lang IN ('tk', 'ru')),
    default_currency TEXT NOT NULL DEFAULT 'TMT' CHECK (default_currency IN ('TMT', 'USD')),
    distance_unit    TEXT NOT NULL DEFAULT 'km' CHECK (distance_unit IN ('km', 'mi')),
    date_format      TEXT NOT NULL DEFAULT 'DD.MM.YYYY' CHECK (date_format IN ('DD.MM.YYYY', 'YYYY-MM-DD')),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_data.admin_settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM app_data.admin_settings WHERE id = 1);

CREATE TABLE IF NOT EXISTS app_data.admin_notification_prefs (
    admin_id            INTEGER PRIMARY KEY REFERENCES app_data.admin_users(id) ON DELETE CASCADE,
    rows                JSONB NOT NULL DEFAULT '[
        {"key": "new_order",       "push": true,  "sms": false, "email": false},
        {"key": "order_late",      "push": true,  "sms": true,  "email": false},
        {"key": "order_cancelled", "push": true,  "sms": true,  "email": true},
        {"key": "driver_offline",  "push": true,  "sms": false, "email": false},
        {"key": "daily_report",    "push": false, "sms": false, "email": true}
    ]'::jsonb,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start   TIME NOT NULL DEFAULT '22:00',
    quiet_hours_end     TIME NOT NULL DEFAULT '07:00',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
