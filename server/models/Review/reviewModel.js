const { sequelize } = require('../../db');

async function createReview({ orderId, userId, taxiId, rating, comment }) {
    const query = `
        INSERT INTO app_data.order_reviews (order_id, user_id, taxi_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const rows = await sequelize.query(query, {
        bind: [orderId, userId, taxiId, rating, comment ?? null],
        type: sequelize.QueryTypes.SELECT,
    });
    return rows[0];
}

// pagination: { limit, offset }
async function getReviewsByTaxi(taxiId, { limit = 20, offset = 0 } = {}) {
    const query = `
        SELECT id, order_id, user_id, taxi_id, rating, comment, created_at,
               COUNT(*) OVER() AS total_count
        FROM app_data.order_reviews
        WHERE taxi_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `;
    const rows = await sequelize.query(query, { bind: [taxiId, limit, offset], type: sequelize.QueryTypes.SELECT });
    return {
        data:  rows,
        total: rows[0] ? Number(rows[0].total_count) : 0,
        limit,
        offset,
    };
}

// pagination: { limit, offset }
async function getReviewsByUser(userId, { limit = 20, offset = 0 } = {}) {
    const query = `
        SELECT id, order_id, user_id, taxi_id, rating, comment, created_at,
               COUNT(*) OVER() AS total_count
        FROM app_data.order_reviews
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `;
    const rows = await sequelize.query(query, { bind: [userId, limit, offset], type: sequelize.QueryTypes.SELECT });
    return {
        data:  rows,
        total: rows[0] ? Number(rows[0].total_count) : 0,
        limit,
        offset,
    };
}

module.exports = {
    createReview,
    getReviewsByTaxi,
    getReviewsByUser,
};
