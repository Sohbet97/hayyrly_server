const DriverService = require('../services/driverService');
const BalanceModel = require('../../../models/User/balanceModel');
const ApiError = require('../../../exceptions/api-error');

class DriverController {
    static async list(req, res, next) {
        try {
            const { cityId, isActive, limit, page } = req.query;
            const result = await DriverService.list({
                cityId: cityId ? parseInt(cityId, 10) : undefined,
                isActive: isActive !== undefined ? isActive === 'true' : undefined,
                limit, page,
            });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async setActive(req, res, next) {
        try {
            const userId = req.params.userId;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                throw ApiError.BadRequest('isActive (boolean) is required');
            }

            const result = await DriverService.setActive(userId, isActive);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async adjustBalance(req, res, next) {
        try {
            const userId = req.params.userId;
            const { amount, direction, note } = req.body;

            if (!amount || !['add', 'remove'].includes(direction)) {
                throw ApiError.BadRequest('amount and direction (add|remove) are required');
            }

            const data = {
                userId,
                price: amount,
                sendedUserId: req.admin.id,
                sendedName: req.admin.name,
                confirmedName: note || req.admin.name,
            };

            const result = direction === 'add'
                ? await BalanceModel.addBalanceInUser(data)
                : await BalanceModel.removeBalanceInUSer(data);

            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = DriverController;
