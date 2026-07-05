const { sequelize, Taxi } = require('../../../db');
const ApiError = require('../../../exceptions/api-error');

class DriverService {
    static async list({ cityId, isActive, limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const conditions = [];
        const replacements = { limit: parsedLimit, offset };

        if (cityId) { conditions.push('t.city_id = :cityId'); replacements.cityId = cityId; }
        // taxies.is_active is smallint (0/1) in Postgres, not boolean — binding a JS
        // boolean here throws "operator does not exist: smallint = boolean".
        if (isActive !== undefined) { conditions.push('t.is_active = :isActive'); replacements.isActive = isActive ? 1 : 0; }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const rows = await sequelize.query(`
            SELECT
                t.id, t.user_id, t.first_name, t.last_name, t.phone, t.auto_number, t.auto_year,
                t.is_active, t.park, t.city_id,
                c.name_tm AS city_name,
                mk.name AS marka_name, cm.name AS model_name,
                COALESCE(b.price, 0) AS balance,
                (SELECT COUNT(*) FROM app_data.taxi_orders o WHERE o.taxi_id = t.id AND o.status = 'completed') AS completed_orders,
                COUNT(*) OVER() AS total_count
            FROM app_data.taxies t
            LEFT JOIN app_data.cities c ON c.id = t.city_id
            LEFT JOIN app_data.markas mk ON mk.id = t.marka_id
            LEFT JOIN app_data.models cm ON cm.id = t.model_id
            LEFT JOIN app_data.balance b ON b.user_id = t.user_id
            ${where}
            ORDER BY t.id DESC
            LIMIT :limit OFFSET :offset
        `, { replacements, type: sequelize.QueryTypes.SELECT });

        return {
            data: rows,
            total: rows[0] ? Number(rows[0].total_count) : 0,
            limit: parsedLimit,
            page: parsedPage,
        };
    }

    static async setActive(userId, isActive) {
        const taxi = await Taxi.findOne({ where: { user_id: userId } });
        if (!taxi) throw ApiError.NotFound('Driver not found');

        taxi.is_active = isActive;
        await taxi.save();
        return taxi.get({ plain: true });
    }
}

module.exports = DriverService;
