const { sequelize } = require('../../../db');
const OrderModel = require('../../../models/Order/orderModel');

class OrderService {
    static async getById(orderId) {
        const [row] = await sequelize.query(`
            SELECT
                o.*,
                ST_Y(o.start_location::geometry) AS start_lat,
                ST_X(o.start_location::geometry) AS start_lng,
                CASE WHEN o.end_location IS NOT NULL THEN ST_Y(o.end_location::geometry) ELSE NULL END AS end_lat,
                CASE WHEN o.end_location IS NOT NULL THEN ST_X(o.end_location::geometry) ELSE NULL END AS end_lng,
                u.id AS client_id, u.full_name AS client_name, u.phone AS client_phone,
                t.id AS driver_id, t.first_name AS driver_first_name, t.last_name AS driver_last_name, t.phone AS driver_phone
            FROM app_data.taxi_orders o
            JOIN app_data.users u ON u.id = o.user_id
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            WHERE o.id = :orderId
        `, { replacements: { orderId }, type: sequelize.QueryTypes.SELECT });

        if (!row) return null;

        const [logs, track] = await Promise.all([
            OrderModel.getLogsByOrder(orderId),
            OrderModel.getTrackByOrder(orderId),
        ]);

        return { ...row, logs, track };
    }
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

    // Shared by dailyReport/ordersByCity/cancellationSplit/peakHours: prefer an
    // explicit from/to range, falling back to the legacy `days` window.
    static _rangeWhere({ from, to, days, cityId }, alias = 'o') {
        const conditions = [];
        const replacements = {};
        if (from || to) {
            if (from) { conditions.push(`${alias}.created_at >= :from`); replacements.from = from; }
            if (to) { conditions.push(`${alias}.created_at < :to`); replacements.to = to; }
        } else {
            conditions.push(`${alias}.created_at >= NOW() - (:days || ' days')::interval`);
            replacements.days = parseInt(days, 10) || 14;
        }
        if (cityId) { conditions.push('t.city_id = :cityId'); replacements.cityId = cityId; }
        return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', replacements };
    }

    static async dailyReport({ from, to, days = 14, cityId } = {}) {
        const { where, replacements } = OrderService._rangeWhere({ from, to, days, cityId }, 'o');
        const rows = await sequelize.query(`
            SELECT
                date_trunc('day', o.created_at)::date AS date,
                COUNT(*) FILTER (WHERE o.status = 'completed') AS delivered,
                COUNT(*) FILTER (WHERE o.status IN ('cancelled_by_user', 'cancelled_by_driver')) AS failed
            FROM app_data.taxi_orders o
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            ${where}
            GROUP BY 1
            ORDER BY 1 ASC
        `, { replacements, type: sequelize.QueryTypes.SELECT });
        return rows;
    }

    static async _totals({ from, to, cityId } = {}) {
        const conditions = [];
        const replacements = {};
        if (from) { conditions.push('o.created_at >= :from'); replacements.from = from; }
        if (to) { conditions.push('o.created_at < :to'); replacements.to = to; }
        if (cityId) { conditions.push('t.city_id = :cityId'); replacements.cityId = cityId; }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [totals] = await sequelize.query(`
            SELECT
                COUNT(*) AS total_orders,
                COUNT(*) FILTER (WHERE o.status = 'completed') AS completed,
                COUNT(*) FILTER (WHERE o.status = 'cancelled_by_user') AS cancelled_by_user,
                COUNT(*) FILTER (WHERE o.status = 'cancelled_by_driver') AS cancelled_by_driver,
                COALESCE(SUM(o.total_price) FILTER (WHERE o.status = 'completed'), 0) AS revenue,
                COALESCE(AVG(o.distance_km) FILTER (WHERE o.status = 'completed'), 0) AS avg_distance_km
            FROM app_data.taxi_orders o
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            ${where}
        `, { replacements, type: sequelize.QueryTypes.SELECT });
        return { ...totals, where, replacements };
    }

    static async summary({ from, to, cityId } = {}) {
        const { where, replacements, ...totals } = await OrderService._totals({ from, to, cityId });

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
            SELECT COUNT(*) AS count FROM app_data.taxies WHERE is_active = 1
            ${cityId ? 'AND city_id = :cityId' : ''}
        `, { replacements: cityId ? { cityId } : {}, type: sequelize.QueryTypes.SELECT });

        const payConditions = ["p.status = 'paid'"];
        const payReplacements = {};
        if (from) { payConditions.push('p.created_at >= :from'); payReplacements.from = from; }
        if (to) { payConditions.push('p.created_at < :to'); payReplacements.to = to; }
        if (cityId) { payConditions.push('t.city_id = :cityId'); payReplacements.cityId = cityId; }
        const revenueByType = await sequelize.query(`
            SELECT p.payment_type, COALESCE(SUM(p.amount), 0) AS amount
            FROM app_data.payments p
            LEFT JOIN app_data.taxies t ON t.id = p.taxi_id
            WHERE ${payConditions.join(' AND ')}
            GROUP BY p.payment_type
        `, { replacements: payReplacements, type: sequelize.QueryTypes.SELECT });

        const completed = Number(totals.completed ?? 0);
        const revenue = Number(totals.revenue ?? 0);

        let previous = null;
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            const spanMs = toDate.getTime() - fromDate.getTime();
            if (spanMs > 0) {
                const prevTo = fromDate.toISOString();
                const prevFrom = new Date(fromDate.getTime() - spanMs).toISOString();
                const { where: prevWhere, replacements: prevReplacements, ...prevTotals } =
                    await OrderService._totals({ from: prevFrom, to: prevTo, cityId });
                previous = {
                    total_orders: Number(prevTotals.total_orders ?? 0),
                    completed: Number(prevTotals.completed ?? 0),
                    revenue: Number(prevTotals.revenue ?? 0),
                };
            }
        }

        return {
            ...totals,
            avg_order_value: completed > 0 ? revenue / completed : 0,
            revenue_by_type: revenueByType,
            active_drivers: Number(activeDriversRows[0]?.count ?? 0),
            top_drivers: topDrivers,
            previous,
        };
    }

    static async ordersByCity({ from, to, days = 30 } = {}) {
        const { where, replacements } = OrderService._rangeWhere({ from, to, days }, 'o');
        const rows = await sequelize.query(`
            SELECT c.id AS city_id, c.name_tm, c.name_ru, COUNT(o.id) AS order_count
            FROM app_data.taxi_orders o
            JOIN app_data.taxies t ON t.id = o.taxi_id
            JOIN app_data.cities c ON c.id = t.city_id
            ${where}
            GROUP BY c.id, c.name_tm, c.name_ru
            ORDER BY order_count DESC
        `, { replacements, type: sequelize.QueryTypes.SELECT });
        return rows;
    }

    static async cancellationSplit({ from, to, days = 30, cityId } = {}) {
        const { where, replacements } = OrderService._rangeWhere({ from, to, days, cityId }, 'o');
        const [row] = await sequelize.query(`
            SELECT
                COUNT(*) FILTER (WHERE o.status = 'cancelled_by_user') AS cancelled_by_user,
                COUNT(*) FILTER (WHERE o.status = 'cancelled_by_driver') AS cancelled_by_driver
            FROM app_data.taxi_orders o
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            ${where}
        `, { replacements, type: sequelize.QueryTypes.SELECT });
        return {
            cancelled_by_user: Number(row?.cancelled_by_user ?? 0),
            cancelled_by_driver: Number(row?.cancelled_by_driver ?? 0),
        };
    }

    static async peakHours({ from, to, days = 30, cityId } = {}) {
        const { where, replacements } = OrderService._rangeWhere({ from, to, days, cityId }, 'o');
        const rows = await sequelize.query(`
            SELECT EXTRACT(HOUR FROM o.created_at)::int AS hour, COUNT(*) AS order_count
            FROM app_data.taxi_orders o
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            ${where}
            GROUP BY 1
            ORDER BY 1 ASC
        `, { replacements, type: sequelize.QueryTypes.SELECT });
        const byHour = new Map(rows.map(r => [Number(r.hour), Number(r.order_count)]));
        return Array.from({ length: 24 }, (_, hour) => ({ hour, order_count: byHour.get(hour) ?? 0 }));
    }
}

module.exports = OrderService;
