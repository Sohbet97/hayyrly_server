const { sequelize, User } = require('../../../db');
const ApiError = require('../../../exceptions/api-error');

class ClientService {
    static async list({ search, isBlocked, limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const conditions = ["u.role = 'client'"];
        const replacements = { limit: parsedLimit, offset };

        if (isBlocked !== undefined) { conditions.push('u.is_blocked = :isBlocked'); replacements.isBlocked = isBlocked; }
        if (search) {
            conditions.push('(u.full_name ILIKE :search OR u.phone ILIKE :search)');
            replacements.search = `%${search}%`;
        }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const rows = await sequelize.query(`
            SELECT
                u.id, u.full_name, u.phone, u.avatar, u.is_blocked,
                u.blocked_reason, u.blocked_at, u.created_at,
                (SELECT COUNT(*) FROM app_data.taxi_orders o WHERE o.user_id = u.id) AS total_orders,
                (SELECT COUNT(*) FROM app_data.taxi_orders o WHERE o.user_id = u.id AND o.status = 'completed') AS completed_orders,
                (SELECT COALESCE(SUM(o.total_price), 0) FROM app_data.taxi_orders o WHERE o.user_id = u.id AND o.status = 'completed') AS total_spent,
                COUNT(*) OVER() AS total_count
            FROM app_data.users u
            ${where}
            ORDER BY u.id DESC
            LIMIT :limit OFFSET :offset
        `, { replacements, type: sequelize.QueryTypes.SELECT });

        return {
            data: rows,
            total: rows[0] ? Number(rows[0].total_count) : 0,
            limit: parsedLimit,
            page: parsedPage,
        };
    }

    static async getOrders(userId, { limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const rows = await sequelize.query(`
            SELECT
                o.id, o.start_address, o.end_address, o.distance_km, o.payment_type,
                o.total_price, o.status, o.created_at,
                t.first_name AS driver_first_name, t.last_name AS driver_last_name,
                COUNT(*) OVER() AS total_count
            FROM app_data.taxi_orders o
            LEFT JOIN app_data.taxies t ON t.id = o.taxi_id
            WHERE o.user_id = :userId
            ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        `, { replacements: { userId, limit: parsedLimit, offset }, type: sequelize.QueryTypes.SELECT });

        return {
            data: rows,
            total: rows[0] ? Number(rows[0].total_count) : 0,
            limit: parsedLimit,
            page: parsedPage,
        };
    }

    static async setBlocked(userId, isBlocked, reason) {
        const user = await User.findByPk(userId);
        if (!user) throw ApiError.NotFound('Client not found');

        user.is_blocked = isBlocked;
        user.blocked_reason = isBlocked ? (reason ?? null) : null;
        user.blocked_at = isBlocked ? new Date() : null;
        await user.save();
        return user.get({ plain: true });
    }
}

module.exports = ClientService;
