const { City } = require('../../../db');

class CityService {
    static async list() {
        return City.findAll({
            attributes: ['id', 'name_tm', 'name_ru'],
            order: [['name_tm', 'ASC']],
            raw: true,
        });
    }

    static async create({ name_tm, name_ru, name_en }) {
        const row = await City.create({ name_tm, name_ru, name_en });
        return row.get({ plain: true });
    }
}

module.exports = CityService;
