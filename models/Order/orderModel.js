const { pool } = require('../../config/db');

// ─── CREATE ──────────────────────────────────────────────────────────────────

async function createOrder({ userId, startAddress, endAddress, startLat, startLng, endLat, endLng, distanceKm, paymentType, basePrice }) {
    const query = `
        INSERT INTO app_data.taxi_orders
            (user_id, start_address, end_address, start_location, end_location, distance_km, payment_type, base_price, status)
        VALUES
            ($1, $2, $3,
             ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography,
             CASE WHEN $6::float IS NOT NULL AND $7::float IS NOT NULL
                  THEN ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography
                  ELSE NULL END,
             $8, $9, $10, 'created')
        RETURNING *
    `;
    const values = [
        userId,
        startAddress,
        endAddress ?? null,
        startLat,
        startLng,
        endLat ?? null,
        endLng ?? null,
        distanceKm ?? 0,
        paymentType ?? 'cash',
        basePrice ?? 0,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
}

// ─── READ ─────────────────────────────────────────────────────────────────────

async function getOrderById(orderId) {
    const query = `
        SELECT
            o.*,
            ST_Y(o.start_location::geometry)                              AS start_lat,
            ST_X(o.start_location::geometry)                              AS start_lng,
            CASE WHEN o.end_location IS NOT NULL THEN ST_Y(o.end_location::geometry) ELSE NULL END AS end_lat,
            CASE WHEN o.end_location IS NOT NULL THEN ST_X(o.end_location::geometry) ELSE NULL END AS end_lng
        FROM app_data.taxi_orders o
        WHERE o.id = $1
    `;
    const { rows } = await pool.query(query, [orderId]);
    return rows[0] ?? null;
}

// filters: { status, paymentType }
// pagination: { limit, offset }
async function getOrdersByUser(userId, { status, paymentType } = {}, { limit = 20, offset = 0 } = {}) {
    const conditions = ['o.user_id = $1'];
    const values = [userId];
    let idx = 2;

    if (status)      { conditions.push(`o.status = $${idx++}`);       values.push(status); }
    if (paymentType) { conditions.push(`o.payment_type = $${idx++}`); values.push(paymentType); }

    values.push(limit, offset);

    const query = `
        SELECT
            o.id, o.status, o.payment_type,
            o.base_price, o.waiting_price, o.total_price,
            o.start_address, o.end_address,
            o.distance_km, o.created_at,
            ST_Y(o.start_location::geometry)                              AS start_lat,
            ST_X(o.start_location::geometry)                              AS start_lng,
            CASE WHEN o.end_location IS NOT NULL THEN ST_Y(o.end_location::geometry) ELSE NULL END AS end_lat,
            CASE WHEN o.end_location IS NOT NULL THEN ST_X(o.end_location::geometry) ELSE NULL END AS end_lng,
            COUNT(*) OVER() AS total_count
        FROM app_data.taxi_orders o
        WHERE ${conditions.join(' AND ')}
        ORDER BY o.created_at DESC
        LIMIT $${idx++} OFFSET $${idx}
    `;
    const { rows } = await pool.query(query, values);
    return {
        data:  rows,
        total: rows[0] ? Number(rows[0].total_count) : 0,
        limit,
        offset,
    };
}

// filters: { status, paymentType }
// pagination: { limit, offset }
async function getOrdersByTaxi(taxiId, { status, paymentType } = {}, { limit = 20, offset = 0 } = {}) {
    const conditions = ['o.taxi_id = $1'];
    const values = [taxiId];
    let idx = 2;

    if (status)      { conditions.push(`o.status = $${idx++}`);       values.push(status); }
    if (paymentType) { conditions.push(`o.payment_type = $${idx++}`); values.push(paymentType); }

    values.push(limit, offset);

    const query = `
        SELECT
            o.id, o.status, o.payment_type,
            o.base_price, o.waiting_price, o.total_price,
            o.start_address, o.end_address,
            o.distance_km, o.created_at,
            ST_Y(o.start_location::geometry)                              AS start_lat,
            ST_X(o.start_location::geometry)                              AS start_lng,
            CASE WHEN o.end_location IS NOT NULL THEN ST_Y(o.end_location::geometry) ELSE NULL END AS end_lat,
            CASE WHEN o.end_location IS NOT NULL THEN ST_X(o.end_location::geometry) ELSE NULL END AS end_lng,
            COUNT(*) OVER() AS total_count
        FROM app_data.taxi_orders o
        WHERE ${conditions.join(' AND ')}
        ORDER BY o.created_at DESC
        LIMIT $${idx++} OFFSET $${idx}
    `;
    const { rows } = await pool.query(query, values);
    return {
        data:  rows,
        total: rows[0] ? Number(rows[0].total_count) : 0,
        limit,
        offset,
    };
}

// Açyk (active) sargytlar — sürüjä iberiler
// pagination: { limit, offset }
async function getActiveOrdersInCity(cityId, { limit = 50, offset = 0 } = {}) {
    const query = `
        SELECT
            o.id, o.user_id, o.status, o.payment_type, o.base_price,
            o.start_address, o.end_address, o.distance_km, o.created_at,
            ST_Y(o.start_location::geometry)                              AS start_lat,
            ST_X(o.start_location::geometry)                              AS start_lng,
            CASE WHEN o.end_location IS NOT NULL THEN ST_Y(o.end_location::geometry) ELSE NULL END AS end_lat,
            CASE WHEN o.end_location IS NOT NULL THEN ST_X(o.end_location::geometry) ELSE NULL END AS end_lng,
            COUNT(*) OVER() AS total_count
        FROM app_data.taxi_orders o
        JOIN app_data.users u ON u.id = o.user_id
        WHERE o.status = 'created'
          AND u.city_id = $1
        ORDER BY o.created_at ASC
        LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(query, [cityId, limit, offset]);
    return {
        data:  rows,
        total: rows[0] ? Number(rows[0].total_count) : 0,
        limit,
        offset,
    };
}

// ─── STATUS UPDATE ────────────────────────────────────────────────────────────

async function updateOrderStatus(orderId, status, extra = {}) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const fields = ['status = $2', 'updated_at = NOW()'];
        const values = [orderId, status];
        let idx = 3;

        if (extra.taxiId !== undefined) { fields.push(`taxi_id = $${idx++}`);       values.push(extra.taxiId); }
        if (extra.waitingPrice !== undefined) { fields.push(`waiting_price = $${idx++}`); values.push(extra.waitingPrice); }
        if (extra.totalPrice !== undefined)   { fields.push(`total_price = $${idx++}`);   values.push(extra.totalPrice); }

        const updateQuery = `
            UPDATE app_data.taxi_orders
            SET ${fields.join(', ')}
            WHERE id = $1
            RETURNING *
        `;
        const { rows } = await client.query(updateQuery, values);

        await client.query(
            `INSERT INTO app_data.taxi_order_logs (order_id, status) VALUES ($1, $2)`,
            [orderId, status]
        );

        await client.query('COMMIT');
        return rows[0] ?? null;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// ─── TRACKING ─────────────────────────────────────────────────────────────────

async function addTrackPoint(orderId, lat, lng) {
    const query = `
        INSERT INTO app_data.taxi_order_tracks (order_id, location)
        VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography)
    `;
    await pool.query(query, [orderId, lat, lng]);
}

async function getTrackByOrder(orderId) {
    const query = `
        SELECT
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            recorded_at
        FROM app_data.taxi_order_tracks
        WHERE order_id = $1
        ORDER BY recorded_at ASC
    `;
    const { rows } = await pool.query(query, [orderId]);
    return rows;
}

// ─── LOGS ─────────────────────────────────────────────────────────────────────

async function getLogsByOrder(orderId) {
    const query = `
        SELECT status, changed_at
        FROM app_data.taxi_order_logs
        WHERE order_id = $1
        ORDER BY changed_at ASC
    `;
    const { rows } = await pool.query(query, [orderId]);
    return rows;
}

// Ожidaniye wagty: 'arrived' → 'on_way' aralygy sekuntda
async function getWaitingSeconds(orderId) {
    const query = `
        SELECT
            EXTRACT(EPOCH FROM (
                (SELECT changed_at FROM app_data.taxi_order_logs WHERE order_id = $1 AND status = 'on_way'   ORDER BY changed_at DESC LIMIT 1) -
                (SELECT changed_at FROM app_data.taxi_order_logs WHERE order_id = $1 AND status = 'arrived' ORDER BY changed_at DESC LIMIT 1)
            ))::int AS waiting_seconds
    `;
    const { rows } = await pool.query(query, [orderId]);
    return rows[0]?.waiting_seconds ?? 0;
}

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByUser,
    getOrdersByTaxi,
    getActiveOrdersInCity,
    updateOrderStatus,
    addTrackPoint,
    getTrackByOrder,
    getLogsByOrder,
    getWaitingSeconds,
};
