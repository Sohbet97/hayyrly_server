const CarService = require('../services/carService');

class CarController {
    static async listMarkas(req, res, next) {
        try {
            const data = await CarService.listMarkas();
            return res.status(200).json({ status: true, data });
        } catch (e) { next(e); }
    }
}

module.exports = CarController;
