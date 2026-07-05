const { BalanceTransaction } = require('../../../db');

class TransactionService {
    static async list({ limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const { rows, count } = await BalanceTransaction.findAndCountAll({
            order: [['created_at', 'DESC']],
            limit: parsedLimit,
            offset,
            raw: true,
        });

        return { data: rows, total: count, limit: parsedLimit, page: parsedPage };
    }
}

module.exports = TransactionService;
