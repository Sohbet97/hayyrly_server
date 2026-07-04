const ApplicationService = require('../services/applicationService');
const Validator = require('../../../utils/validator');
const { applicationSubmitSchema, applicationRejectSchema } = require('../validators/application.schema');
const ApiError = require('../../../exceptions/api-error');

class ApplicationController {
    // Public — mobile client submits a driver application.
    static async submit(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(applicationSubmitSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await ApplicationService.submit(req.body);
            return res.status(201).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async list(req, res, next) {
        try {
            const { status, limit, page } = req.query;
            const result = await ApplicationService.list({ status, limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const result = await ApplicationService.getById(req.params.id);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async approve(req, res, next) {
        try {
            const result = await ApplicationService.approve(req.params.id, req.admin.id);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async reject(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(applicationRejectSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await ApplicationService.reject(req.params.id, req.admin.id, req.body.reason);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = ApplicationController;
