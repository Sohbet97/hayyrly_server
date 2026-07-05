const CityService = require('../services/cityService');
const Validator = require('../../../utils/validator');
const { createCitySchema } = require('../validators/city.schema');
const ApiError = require('../../../exceptions/api-error');

class CityController {
    static async list(req, res, next) {
        try {
            const data = await CityService.list();
            return res.status(200).json({ status: true, data });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(createCitySchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await CityService.create(req.body);
            return res.status(201).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = CityController;
