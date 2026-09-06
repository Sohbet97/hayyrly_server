const { sequelize } = require('../../db');

async function createSosAlert({ orderId, userId, taxiId, phone, note, lat, lng }) {
    const query = `
        INSERT INTO app_data.sos_alerts (order_id, user_id, taxi_id, phone, note, location)
        VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography)
        RETURNING id, order_id, user_id, taxi_id, phone, note, status, created_at,
                  ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    `;
    const rows = await sequelize.query(query, {
        bind: [orderId ?? null, userId ?? null, taxiId ?? null, phone, note ?? null, lat, lng],
        type: sequelize.QueryTypes.SELECT,
    });
    return rows[0];
}

// pagination: { limit, offset }
async function listAlerts({ status } = {}, { limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) { conditions.push(`status = $${idx++}`); values.push(status); }

    values.push(limit, offset);

    const query = `
        SELECT id, order_id, user_id, taxi_id, phone, note, status, created_at,
               ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
               COUNT(*) OVER() AS total_count
        FROM app_data.sos_alerts
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY created_at DESC
        LIMIT $${idx++} OFFSET $${idx}
    `;
    const rows = await sequelize.query(query, { bind: values, type: sequelize.QueryTypes.SELECT });
    return {
        data:  rows,
        total: rows[0] ? Number(rows[0].total_count) : 0,
        limit,
        offset,
    };
}

async function updateAlertStatus(id, status) {
    const query = `
        UPDATE app_data.sos_alerts
        SET status = $2
        WHERE id = $1
        RETURNING id, order_id, user_id, taxi_id, phone, note, status, created_at,
                  ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    `;
    const rows = await sequelize.query(query, { bind: [id, status], type: sequelize.QueryTypes.SELECT });
    return rows[0] ?? null;
}

module.exports = {
    createSosAlert,
    listAlerts,
    updateAlertStatus,
};
