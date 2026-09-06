-- Support chat: one continuous thread per user with the admin team, separate from
-- order chat (which is driver↔client only, see app_data.order_messages).

CREATE TABLE IF NOT EXISTS app_data.support_messages (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES app_data.users(id),
    sender_type app_data.user_type NOT NULL, -- 'user' | 'admin'
    sender_id   INTEGER NOT NULL,
    message     TEXT,
    photo_url   TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_support_message_or_photo CHECK (message IS NOT NULL OR photo_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON app_data.support_messages(user_id, created_at);
