const PricingService = require('../services/pricingService');
const Validator = require('../../../utils/validator');
const { pricingUpdateSchema } = require('../validators/pricing.schema');
const ApiError = require('../../../exceptions/api-error');

class PricingController {
    static async list(req, res, next) {
        try {
            const data = await PricingService.list();
            return res.status(200).json({ status: true, data });
        } catch (e) { next(e); }
    }

    static async getPublic(req, res, next) {
        try {
            const result = await PricingService.getByCity(req.params.cityId);
            if (!result) throw ApiError.NotFound('Pricing not configured for this city');
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(pricingUpdateSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await PricingService.upsert(req.params.cityId, req.body, req.admin.id);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = PricingController;
