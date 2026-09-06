const { sequelize, Taxi, User } = require('../../../db');
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
                t.is_active, t.park, t.city_id, t.avatar,
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

    static async getById(userId) {
        const rows = await sequelize.query(`
            SELECT
                t.id, t.user_id, t.first_name, t.last_name, t.phone, t.auto_number, t.auto_year,
                t.is_active, t.park, t.city_id, t.avatar, t.auto_image,
                -- node-postgres parses date columns into a JS Date at local midnight;
                -- letting that cross JSON.stringify (which always renders UTC) shifts
                -- the calendar day whenever the server's TZ isn't UTC. Cast to text.
                to_char(t.birthday, 'YYYY-MM-DD') AS birthday,
                c.name_tm AS city_name,
                mk.id AS marka_id, mk.name AS marka_name, cm.id AS model_id, cm.name AS model_name,
                COALESCE(b.price, 0) AS balance,
                (SELECT COUNT(*) FROM app_data.taxi_orders o WHERE o.taxi_id = t.id) AS total_orders,
                (SELECT COUNT(*) FROM app_data.taxi_orders o WHERE o.taxi_id = t.id AND o.status = 'completed') AS completed_orders,
                (SELECT COALESCE(SUM(o.total_price), 0) FROM app_data.taxi_orders o WHERE o.taxi_id = t.id AND o.status = 'completed') AS total_earned
            FROM app_data.taxies t
            LEFT JOIN app_data.cities c ON c.id = t.city_id
            LEFT JOIN app_data.markas mk ON mk.id = t.marka_id
            LEFT JOIN app_data.models cm ON cm.id = t.model_id
            LEFT JOIN app_data.balance b ON b.user_id = t.user_id
            WHERE t.user_id = :userId
        `, { replacements: { userId }, type: sequelize.QueryTypes.SELECT });

        if (!rows[0]) throw ApiError.NotFound('Driver not found');
        return rows[0];
    }

    static async getOrders(userId, { limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const taxi = await Taxi.findOne({ where: { user_id: userId }, raw: true });
        if (!taxi) throw ApiError.NotFound('Driver not found');

        const rows = await sequelize.query(`
            SELECT
                o.id, o.start_address, o.end_address, o.distance_km, o.payment_type,
                o.total_price, o.status, o.created_at,
                u.full_name AS client_name, u.phone AS client_phone,
                COUNT(*) OVER() AS total_count
            FROM app_data.taxi_orders o
            LEFT JOIN app_data.users u ON u.id = o.user_id
            WHERE o.taxi_id = :taxiId
            ORDER BY o.created_at DESC
            LIMIT :limit OFFSET :offset
        `, { replacements: { taxiId: taxi.id, limit: parsedLimit, offset }, type: sequelize.QueryTypes.SELECT });

        return {
            data: rows,
            total: rows[0] ? Number(rows[0].total_count) : 0,
            limit: parsedLimit,
            page: parsedPage,
        };
    }

    static async create(payload) {
        return sequelize.transaction(async (t) => {
            let user = await User.findOne({ where: { phone: payload.phone }, transaction: t });

            if (user) {
                const existingTaxi = await Taxi.findOne({ where: { user_id: user.id }, transaction: t });
                if (existingTaxi) throw ApiError.Conflict('A driver with this phone already exists');
                if (user.role !== 'driver') {
                    user.role = 'driver';
                    await user.save({ transaction: t });
                }
            } else {
                user = await User.create({
                    phone: payload.phone,
                    full_name: `${payload.firstName} ${payload.lastName}`,
                    role: 'driver',
                    city_id: payload.cityId ?? null,
                }, { transaction: t });
            }

            const taxi = await Taxi.create({
                first_name: payload.firstName,
                last_name: payload.lastName,
                phone: payload.phone,
                birthday: payload.birthday,
                user_id: user.id,
                city_id: payload.cityId,
                auto_number: payload.autoNumber,
                marka_id: payload.markaId,
                model_id: payload.modelId,
                auto_year: payload.autoYear,
                park: payload.park ?? null,
                avatar: payload.avatar ?? null,
                auto_image: payload.autoImage ?? null,
                is_active: true,
            }, { transaction: t });

            return taxi.get({ plain: true });
        });
    }

    static async update(userId, payload) {
        return sequelize.transaction(async (t) => {
            const taxi = await Taxi.findOne({ where: { user_id: userId }, transaction: t });
            if (!taxi) throw ApiError.NotFound('Driver not found');

            // Check against the phone actually being written to `users` below — comparing
            // against taxi.phone instead would wrongly skip this when taxi.phone and
            // users.phone have already drifted apart, letting the save below crash with
            // a unique-constraint violation instead of a clean 409.
            if (payload.phone !== undefined) {
                const existing = await User.findOne({ where: { phone: payload.phone }, transaction: t });
                if (existing && existing.id !== userId) throw ApiError.Conflict('This phone is already in use');
            }

            const fields = [
                'firstName', 'lastName', 'phone', 'birthday', 'cityId', 'autoNumber',
                'markaId', 'modelId', 'autoYear', 'park', 'avatar', 'autoImage',
            ];
            const columnByField = {
                firstName: 'first_name', lastName: 'last_name', phone: 'phone', birthday: 'birthday', cityId: 'city_id',
                autoNumber: 'auto_number', markaId: 'marka_id', modelId: 'model_id', autoYear: 'auto_year',
                park: 'park', avatar: 'avatar', autoImage: 'auto_image',
            };

            for (const field of fields) {
                if (payload[field] === undefined) continue;
                taxi[columnByField[field]] = payload[field];
            }
            await taxi.save({ transaction: t });

            const user = await User.findByPk(userId, { transaction: t });
            if (user) {
                if (payload.firstName !== undefined || payload.lastName !== undefined) {
                    user.full_name = `${taxi.first_name} ${taxi.last_name}`;
                }
                if (payload.phone !== undefined) user.phone = payload.phone;
                if (payload.cityId !== undefined) user.city_id = payload.cityId;
                await user.save({ transaction: t });
            }

            return taxi.get({ plain: true });
        });
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
