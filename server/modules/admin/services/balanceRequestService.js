const { BalanceRequest, BalanceRequestMessage, User } = require('../../../db');
const BalanceModel = require('../../../models/User/balanceModel');
const ApiError = require('../../../exceptions/api-error');

class BalanceRequestService {
    static async submit(userId, { amount, message, photoUrl }) {
        const parsedAmount = amount != null ? parseFloat(amount) : null;
        if (amount != null && (!parsedAmount || parsedAmount <= 0)) {
            throw ApiError.BadRequest('amount must be a positive number');
        }

        const request = await BalanceRequest.create({ user_id: userId, amount: parsedAmount });

        if (message || photoUrl) {
            await BalanceRequestMessage.create({
                request_id: request.id,
                sender_type: 'user',
                sender_id: userId,
                message: message ?? null,
                photo_url: photoUrl ?? null,
            });
        }

        return request.get({ plain: true });
    }

    static async listByUser(userId, { limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const { rows, count } = await BalanceRequest.findAndCountAll({
            where: { user_id: userId }, order: [['created_at', 'DESC']], limit: parsedLimit, offset, raw: true,
        });

        return { data: rows, total: count, limit: parsedLimit, page: parsedPage };
    }

    static async list({ status, limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;
        const where = status ? { status } : {};

        const { rows, count } = await BalanceRequest.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }],
            order: [['created_at', 'DESC']], limit: parsedLimit, offset, nest: true, raw: true,
        });

        return { data: rows, total: count, limit: parsedLimit, page: parsedPage };
    }

    static async getById(id) {
        const request = await BalanceRequest.findByPk(id, {
            include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }],
            nest: true, raw: true,
        });
        if (!request) throw ApiError.NotFound('Balance request not found');

        const messages = await BalanceRequestMessage.findAll({
            where: { request_id: id }, order: [['created_at', 'ASC']], raw: true,
        });

        return { ...request, messages };
    }

    static async confirm(id, operatorId) {
        const request = await BalanceRequest.findByPk(id);
        if (!request) throw ApiError.NotFound('Balance request not found');
        if (request.status !== 'pending') throw ApiError.Conflict('Request already reviewed');
        if (!request.amount) throw ApiError.BadRequest('Request has no amount to credit');

        // Matches the existing convention already present in balance_tranzaksion for
        // confirmed requests: sendedUserId/confirmedUserId are both the requesting user,
        // sendedName describes the top-up, confirmedName identifies the operator.
        await BalanceModel.addBalanceInUser({
            userId: request.user_id,
            price: request.amount,
            sendedUserId: request.user_id,
            sendedName: `Balans dolduryş #${request.id}`,
            confirmedName: `Operator #${operatorId}`,
        });

        await request.update({ status: 'confirmed', operator_id: operatorId });
        return request.get({ plain: true });
    }

    static async reject(id, operatorId, reason) {
        const request = await BalanceRequest.findByPk(id);
        if (!request) throw ApiError.NotFound('Balance request not found');
        if (request.status !== 'pending') throw ApiError.Conflict('Request already reviewed');

        await request.update({ status: 'rejected', operator_id: operatorId, reject_reason: reason ?? null });
        return request.get({ plain: true });
    }

    static async addMessage(requestId, { senderType, senderId, message, photoUrl }) {
        const request = await BalanceRequest.findByPk(requestId, { raw: true });
        if (!request) throw ApiError.NotFound('Balance request not found');
        if (!message && !photoUrl) throw ApiError.BadRequest('message or photoUrl is required');

        const row = await BalanceRequestMessage.create({
            request_id: requestId,
            sender_type: senderType,
            sender_id: senderId,
            message: message ?? null,
            photo_url: photoUrl ?? null,
        });
        return row.get({ plain: true });
    }

    static async listMessages(requestId) {
        return BalanceRequestMessage.findAll({
            where: { request_id: requestId }, order: [['created_at', 'ASC']], raw: true,
        });
    }
}

module.exports = BalanceRequestService;
