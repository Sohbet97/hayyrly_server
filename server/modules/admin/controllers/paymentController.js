const PaymentService = require('../services/paymentService');
const Validator = require('../../../utils/validator');
const { refundSchema } = require('../validators/payments.schema');
const ApiError = require('../../../exceptions/api-error');

class PaymentController {
    static async list(req, res, next) {
        try {
            const { status, paymentType, driverId, search, from, to, limit, page } = req.query;
            const result = await PaymentService.list({
                status, paymentType, search, from, to, limit, page,
                driverId: driverId ? parseInt(driverId, 10) : undefined,
            });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async summary(req, res, next) {
        try {
            const { from, to } = req.query;
            const result = await PaymentService.summary({ from, to });
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async refund(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(refundSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await PaymentService.refund(req.params.id, {
                adminId: req.admin.id,
                note: req.body.note,
            });
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = PaymentController;
