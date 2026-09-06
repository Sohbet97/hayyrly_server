const { Marka, CarModel } = require('../../../db');

class CarService {
    static async listMarkas() {
        const markas = await Marka.findAll({
            attributes: ['id', 'name'],
            include: [{ model: CarModel, as: 'models', attributes: ['id', 'name'] }],
            order: [['name', 'ASC']],
        });
        return markas.map((m) => m.get({ plain: true }));
    }
}

module.exports = CarService;
