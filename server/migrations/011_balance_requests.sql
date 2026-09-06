-- Balance top-up requests: user submits a top-up request, chats with an operator
-- (text/photo proof) via balance_request_messages, operator confirms/rejects.
-- NOTE: this schema already exists in the production DB (created out-of-band, ahead
-- of this repo's migration history) — this file documents it for fresh installs.

DO $$ BEGIN
    CREATE TYPE app_data.balance_request_status AS ENUM ('pending', 'confirmed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE app_data.user_type AS ENUM ('user', 'taxi', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS app_data.balance_requests (
    id            BIGSERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES app_data.users(id),
    status        app_data.balance_request_status NOT NULL DEFAULT 'pending',
    amount        NUMERIC(10,2),
    operator_id   INTEGER REFERENCES app_data.users(id),
    reject_reason TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_balance_requests_user_id ON app_data.balance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_requests_status ON app_data.balance_requests(status, created_at);

CREATE TABLE IF NOT EXISTS app_data.balance_request_messages (
    id          BIGSERIAL PRIMARY KEY,
    request_id  BIGINT NOT NULL REFERENCES app_data.balance_requests(id) ON DELETE CASCADE,
    sender_type app_data.user_type NOT NULL,
    sender_id   INTEGER NOT NULL,
    message     TEXT,
    photo_url   TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_message_or_photo CHECK (message IS NOT NULL OR photo_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_balance_request_messages_request_id ON app_data.balance_request_messages(request_id, created_at);
