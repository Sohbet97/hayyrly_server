const TransactionService = require('../services/transactionService');

class TransactionController {
    static async list(req, res, next) {
        try {
            const { limit, page } = req.query;
            const result = await TransactionService.list({ limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }
}

module.exports = TransactionController;
