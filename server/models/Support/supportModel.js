const { sequelize } = require('../../db');

async function addMessage({ userId, senderType, senderId, message, photoUrl }) {
    const query = `
        INSERT INTO app_data.support_messages (user_id, sender_type, sender_id, message, photo_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const rows = await sequelize.query(query, {
        bind: [userId, senderType, senderId, message ?? null, photoUrl ?? null],
        type: sequelize.QueryTypes.SELECT,
    });
    return rows[0];
}

// pagination: { limit, offset }
async function getMessagesByUser(userId, { limit = 50, offset = 0 } = {}) {
    const query = `
        SELECT id, user_id, sender_type, sender_id, message, photo_url, is_read, created_at
        FROM app_data.support_messages
        WHERE user_id = $1
        ORDER BY created_at ASC
        LIMIT $2 OFFSET $3
    `;
    const rows = await sequelize.query(query, { bind: [userId, limit, offset], type: sequelize.QueryTypes.SELECT });
    return rows;
}

// Admin inbox: one row per user thread — last message + count of unread user messages.
// pagination: { limit, offset }
async function listThreads({ limit = 20, offset = 0 } = {}) {
    const query = `
        SELECT
            u.id AS user_id,
            u.full_name,
            last_msg.message AS last_message,
            last_msg.photo_url AS last_photo_url,
            last_msg.sender_type AS last_sender_type,
            last_msg.created_at AS last_created_at,
            COALESCE(unread.unread_count, 0) AS unread_count,
            COUNT(*) OVER() AS total_count
        FROM (SELECT DISTINCT user_id FROM app_data.support_messages) t
        JOIN app_data.users u ON u.id = t.user_id
        JOIN LATERAL (
            SELECT message, photo_url, sender_type, created_at
            FROM app_data.support_messages
            WHERE user_id = t.user_id
            ORDER BY created_at DESC
            LIMIT 1
        ) last_msg ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS unread_count
            FROM app_data.support_messages
            WHERE user_id = t.user_id AND sender_type = 'user' AND is_read = false
        ) unread ON true
        ORDER BY last_msg.created_at DESC
        LIMIT $1 OFFSET $2
    `;
    const rows = await sequelize.query(query, { bind: [limit, offset], type: sequelize.QueryTypes.SELECT });
    return {
        data:  rows,
        total: rows[0] ? Number(rows[0].total_count) : 0,
        limit,
        offset,
    };
}

async function markUserMessagesRead(userId) {
    await sequelize.query(
        `UPDATE app_data.support_messages SET is_read = true WHERE user_id = $1 AND sender_type = 'user' AND is_read = false`,
        { bind: [userId] }
    );
}

module.exports = {
    addMessage,
    getMessagesByUser,
    listThreads,
    markUserMessagesRead,
};
