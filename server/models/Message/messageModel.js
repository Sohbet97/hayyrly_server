const { sequelize } = require('../../db');

async function addMessage({ orderId, senderType, senderId, body }) {
    const query = `
        INSERT INTO app_data.order_messages (order_id, sender_type, sender_id, body)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const rows = await sequelize.query(query, {
        bind: [orderId, senderType, senderId ?? null, body],
        type: sequelize.QueryTypes.SELECT,
    });
    return rows[0];
}

// pagination: { limit, offset }
async function getMessagesByOrder(orderId, { limit = 200, offset = 0 } = {}) {
    const query = `
        SELECT id, order_id, sender_type, sender_id, body, created_at
        FROM app_data.order_messages
        WHERE order_id = $1
        ORDER BY created_at ASC
        LIMIT $2 OFFSET $3
    `;
    const rows = await sequelize.query(query, { bind: [orderId, limit, offset], type: sequelize.QueryTypes.SELECT });
    return rows;
}

module.exports = {
    addMessage,
    getMessagesByOrder,
};
