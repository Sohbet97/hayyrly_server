const { sequelize } = require('../../../db');

class OrderService {
    static async list({ status, cityId, limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const conditions = [];
        const replacements = { limit: parsedLimit, offset };

        if (status) { conditions.push('o.status = :status'); replacements.status = status; }
        if (cityId) { conditions.push('u.city_id = :cityId'); replacements.cityId = cityId; }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const rows = await sequelize.query(`
            SELECT
                o.id, o.status, o.payment_type, o.base_price, o.waiting_price, o.total_price,
                o.start_address, o.end_address, o.distance_km, o.created_at,
                ST_Y(o.start_location::geometry) AS start_lat,
                ST_X(o.start_location::geometry) AS start_lng,
                CASE WHEN o.end_location IS NOT NULL THEN ST_Y(o.end_location::geometry) ELSE NULL END AS end_lat,
                CASE WHEN o.end_location IS NOT NULL THEN ST_X(o.end_location::geometry) ELSE NULL END AS end_lng,
                u.id AS client_id, u.full_name AS client_name, u.phone AS client_phone,
                t.id AS driver_id, t.first_name AS driver_first_name, t.last_name AS driver_last_name, t.phone AS driver_phone,
                COUNT(*) OVER() AS total_count
            FROM app_data.taxi_orders o
            JOIN app_data.users u ON u.id = o.user_id
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            ${where}
            ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        `, { replacements, type: sequelize.QueryTypes.SELECT });

        return {
            data: rows,
            total: rows[0] ? Number(rows[0].total_count) : 0,
            limit: parsedLimit,
            page: parsedPage,
        };
    }

    static async dailyReport({ days = 14 } = {}) {
        const rows = await sequelize.query(`
            SELECT
                date_trunc('day', created_at)::date AS date,
                COUNT(*) FILTER (WHERE status = 'completed') AS delivered,
                COUNT(*) FILTER (WHERE status IN ('cancelled_by_user', 'cancelled_by_driver')) AS failed
            FROM app_data.taxi_orders
            WHERE created_at >= NOW() - (:days || ' days')::interval
            GROUP BY 1
            ORDER BY 1 ASC
        `, { replacements: { days: parseInt(days, 10) || 14 }, type: sequelize.QueryTypes.SELECT });
        return rows;
    }

    static async summary({ from, to, cityId } = {}) {
        const conditions = [];
        const replacements = {};
        if (from) { conditions.push('o.created_at >= :from'); replacements.from = from; }
        if (to) { conditions.push('o.created_at <= :to'); replacements.to = to; }
        if (cityId) { conditions.push('t.city_id = :cityId'); replacements.cityId = cityId; }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [totals] = await sequelize.query(`
            SELECT
                COUNT(*) AS total_orders,
                COUNT(*) FILTER (WHERE o.status = 'completed') AS completed,
                COUNT(*) FILTER (WHERE o.status = 'cancelled_by_user') AS cancelled_by_user,
                COUNT(*) FILTER (WHERE o.status = 'cancelled_by_driver') AS cancelled_by_driver,
                COALESCE(SUM(o.total_price) FILTER (WHERE o.status = 'completed'), 0) AS revenue
            FROM app_data.taxi_orders o
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            ${where}
        `, { replacements, type: sequelize.QueryTypes.SELECT });

        const topDrivers = await sequelize.query(`
            SELECT t.id, t.first_name, t.last_name, COUNT(o.id) AS order_count,
                COALESCE(SUM(o.total_price) FILTER (WHERE o.status = 'completed'), 0) AS revenue
            FROM app_data.taxi_orders o
            JOIN app_data.taxies t ON t.id = o.taxi_id
            ${where}
            GROUP BY t.id
            ORDER BY order_count DESC
            LIMIT 5
        `, { replacements, type: sequelize.QueryTypes.SELECT });

        const activeDriversRows = await sequelize.query(`
            SELECT COUNT(*) AS count FROM app_data.taxies WHERE is_active = true
            ${cityId ? 'AND city_id = :cityId' : ''}
        `, { replacements: cityId ? { cityId } : {}, type: sequelize.QueryTypes.SELECT });

        return {
            ...totals,
            active_drivers: Number(activeDriversRows[0]?.count ?? 0),
            top_drivers: topDrivers,
        };
    }
}

module.exports = OrderService;
