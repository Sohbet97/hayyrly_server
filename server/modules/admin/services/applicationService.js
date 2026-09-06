const { DriverApplication, Taxi, User, sequelize } = require('../../../db');
const ApiError = require('../../../exceptions/api-error');

class ApplicationService {
    static async submit(data) {
        const row = await DriverApplication.create({
            user_id: data.userId,
            city_id: data.cityId ?? null,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            birthday: data.birthday ?? null,
            auto_number: data.autoNumber ?? null,
            marka_id: data.markaId ?? null,
            model_id: data.modelId ?? null,
            auto_year: data.autoYear ?? null,
            license_photo: data.licensePhoto ?? null,
            car_image: data.carImage ?? null,
            park: data.park ?? null,
        });
        return row.get({ plain: true });
    }

    static async list({ status, limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;
        const where = status ? { status } : {};

        const { rows, count } = await DriverApplication.findAndCountAll({
            where, order: [['created_at', 'DESC']], limit: parsedLimit, offset, raw: true,
        });

        return { data: rows, total: count, limit: parsedLimit, page: parsedPage };
    }

    static async getById(id) {
        const row = await DriverApplication.findByPk(id, { raw: true });
        if (!row) throw ApiError.NotFound('Application not found');
        return row;
    }

    static async approve(id, adminId) {
        return sequelize.transaction(async (t) => {
            const app = await DriverApplication.findByPk(id, { transaction: t });
            if (!app) throw ApiError.NotFound('Application not found');
            if (app.status !== 'pending') throw ApiError.Conflict('Application already reviewed');

            const taxi = await Taxi.create({
                first_name: app.first_name,
                last_name: app.last_name,
                phone: app.phone,
                birthday: app.birthday,
                user_id: app.user_id,
                city_id: app.city_id,
                auto_number: app.auto_number,
                marka_id: app.marka_id,
                model_id: app.model_id,
                auto_year: app.auto_year,
                auto_image: app.car_image,
                is_active: true,
                // taxies.park is a boolean ("belongs to a park/fleet"); the application's
                // park is the free-text fleet name — presence of one implies the flag.
                park: Boolean(app.park),
            }, { transaction: t });

            await User.update({ role: 'driver' }, { where: { id: app.user_id }, transaction: t });

            await app.update(
                { status: 'approved', reviewed_by: adminId, reviewed_at: new Date() },
                { transaction: t }
            );

            return { application: app.get({ plain: true }), taxi: taxi.get({ plain: true }) };
        });
    }

    static async reject(id, adminId, reason) {
        const app = await DriverApplication.findByPk(id);
        if (!app) throw ApiError.NotFound('Application not found');
        if (app.status !== 'pending') throw ApiError.Conflict('Application already reviewed');

        await app.update({ status: 'rejected', rejection_reason: reason, reviewed_by: adminId, reviewed_at: new Date() });
        return app.get({ plain: true });
    }
}

module.exports = ApplicationService;
