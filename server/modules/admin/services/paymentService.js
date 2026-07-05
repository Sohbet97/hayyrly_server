const { sequelize, Payment } = require('../../../db');
const ApiError = require('../../../exceptions/api-error');

class PaymentService {
    static async list({ status, paymentType, driverId, search, from, to, limit = 20, page = 1 } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const conditions = [];
        const replacements = { limit: parsedLimit, offset };

        if (status)      { conditions.push('p.status = :status'); replacements.status = status; }
        if (paymentType) { conditions.push('p.payment_type = :paymentType'); replacements.paymentType = paymentType; }
        if (driverId)    { conditions.push('p.taxi_id = :driverId'); replacements.driverId = driverId; }
        if (from)        { conditions.push('p.created_at >= :from'); replacements.from = from; }
        if (to)          { conditions.push('p.created_at <= :to'); replacements.to = to; }
        if (search) {
            conditions.push(`(u.full_name ILIKE :search OR t.first_name ILIKE :search OR t.last_name ILIKE :search)`);
            replacements.search = `%${search}%`;
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const rows = await sequelize.query(`
            SELECT
                p.id, p.order_id, p.amount, p.payment_type, p.status,
                p.refund_note, p.refunded_at, p.created_at,
                u.id AS client_id, u.full_name AS client_name,
                t.id AS driver_id, t.first_name AS driver_first_name, t.last_name AS driver_last_name,
                COUNT(*) OVER() AS total_count
            FROM app_data.payments p
            LEFT JOIN app_data.users u ON u.id = p.user_id
            LEFT JOIN app_data.taxies t ON t.id = p.taxi_id
            ${where}
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
        `, { replacements, type: sequelize.QueryTypes.SELECT });

        return {
            data: rows,
            total: rows[0] ? Number(rows[0].total_count) : 0,
            limit: parsedLimit,
            page: parsedPage,
        };
    }

    static async summary({ from, to } = {}) {
        const conditions = [];
        const replacements = {};
        if (from) { conditions.push('created_at >= :from'); replacements.from = from; }
        if (to)   { conditions.push('created_at <= :to'); replacements.to = to; }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [row] = await sequelize.query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
                COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_revenue,
                COUNT(*) FILTER (WHERE status = 'refunded') AS refunded_count,
                COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0) AS total_refunded,
                COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND payment_type = 'cash'), 0) AS cash_revenue,
                COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND payment_type = 'card'), 0) AS card_revenue,
                COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND payment_type = 'balance'), 0) AS balance_revenue
            FROM app_data.payments
            ${where}
        `, { replacements, type: sequelize.QueryTypes.SELECT });

        return row;
    }

    static async refund(paymentId, { adminId, note } = {}) {
        return sequelize.transaction(async (t) => {
            const payment = await Payment.findByPk(paymentId, { transaction: t, lock: t.LOCK.UPDATE });
            if (!payment) throw ApiError.NotFound('Payment not found');
            if (payment.status === 'refunded') throw ApiError.Conflict('Payment already refunded');

            await payment.update({
                status: 'refunded',
                refund_note: note ?? null,
                refunded_at: new Date(),
                refunded_by: adminId,
            }, { transaction: t });

            return payment.get({ plain: true });
        });
    }
}

module.exports = PaymentService;
