const BalanceRequestService = require('../services/balanceRequestService');
const ApiError = require('../../../exceptions/api-error');

class BalanceRequestController {
    // Public — mobile client submits a top-up request (optionally with an opening message/photo).
    static async submit(req, res, next) {
        try {
            const { userId, amount, message, photoUrl } = req.body;
            if (!userId) throw ApiError.BadRequest('userId is required');

            const result = await BalanceRequestService.submit(userId, { amount, message, photoUrl });
            return res.status(201).json({ status: true, result });
        } catch (e) { next(e); }
    }

    // Public — mobile client lists their own requests.
    static async listByUser(req, res, next) {
        try {
            const { limit, page } = req.query;
            const result = await BalanceRequestService.listByUser(req.params.userId, { limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async list(req, res, next) {
        try {
            const { status, limit, page } = req.query;
            const result = await BalanceRequestService.list({ status, limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async getById(req, res, next) {
        try {
            const result = await BalanceRequestService.getById(req.params.id);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async confirm(req, res, next) {
        try {
            const result = await BalanceRequestService.confirm(req.params.id, req.admin.id);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async reject(req, res, next) {
        try {
            const result = await BalanceRequestService.reject(req.params.id, req.admin.id, req.body.reason);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    // Shared by both the public thread (client/driver sends) and the admin thread (operator replies).
    static async listMessages(req, res, next) {
        try {
            const result = await BalanceRequestService.listMessages(req.params.id);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async postMessage(req, res, next) {
        try {
            const { senderType, senderId, message, photoUrl } = req.body;
            if (!senderType || !senderId) throw ApiError.BadRequest('senderType, senderId are required');

            const result = await BalanceRequestService.addMessage(req.params.id, { senderType, senderId, message, photoUrl });
            return res.status(201).json({ status: true, result });
        } catch (e) { next(e); }
    }

    // Admin panel variant — sender is always the authenticated operator.
    static async postAdminMessage(req, res, next) {
        try {
            const { message, photoUrl } = req.body;
            const result = await BalanceRequestService.addMessage(req.params.id, {
                senderType: 'admin', senderId: req.admin.id, message, photoUrl,
            });
            return res.status(201).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = BalanceRequestController;
