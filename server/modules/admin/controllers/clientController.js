const ClientService = require('../services/clientService');
const Validator = require('../../../utils/validator');
const { setBlockedSchema } = require('../validators/client.schema');
const ApiError = require('../../../exceptions/api-error');

class ClientController {
    static async list(req, res, next) {
        try {
            const { search, isBlocked, limit, page } = req.query;
            const result = await ClientService.list({
                search,
                isBlocked: isBlocked !== undefined ? isBlocked === 'true' : undefined,
                limit, page,
            });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async getOrders(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) throw ApiError.BadRequest('Invalid userId');

            const { limit, page } = req.query;
            const result = await ClientService.getOrders(userId, { limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async setBlocked(req, res, next) {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) throw ApiError.BadRequest('Invalid userId');

            const { isError, errors } = await Validator.validate(setBlockedSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await ClientService.setBlocked(userId, req.body.isBlocked, req.body.reason);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = ClientController;
