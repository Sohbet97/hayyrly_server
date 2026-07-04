const { CityPricing, City } = require('../../../db');

class PricingService {
    static async list() {
        const rows = await CityPricing.findAll({
            include: [{ model: City, as: 'city', attributes: ['id', 'name_tm', 'name_ru', 'name_en'] }],
            order: [['city_id', 'ASC']],
        });
        return rows.map((r) => r.get({ plain: true }));
    }

    static async getByCity(cityId) {
        const row = await CityPricing.findOne({ where: { city_id: cityId }, raw: true });
        return row ?? null;
    }

    static async upsert(cityId, data, adminId) {
        const [row, created] = await CityPricing.findOrCreate({
            where: { city_id: cityId },
            defaults: {
                city_id: cityId,
                base_price: data.base_price,
                price_per_km: data.price_per_km,
                free_wait_min: data.free_wait_min,
                wait_price_min: data.wait_price_min,
                updated_at: new Date(),
                updated_by: adminId,
            },
        });

        if (!created) {
            await row.update({
                base_price: data.base_price,
                price_per_km: data.price_per_km,
                free_wait_min: data.free_wait_min,
                wait_price_min: data.wait_price_min,
                updated_at: new Date(),
                updated_by: adminId,
            });
        }

        return row.get({ plain: true });
    }
}

module.exports = PricingService;
