const { Op } = require('sequelize');
const { Balance, BalanceTransaction, sequelize } = require('../../db');
const { normalizePgError } = require('../../db/pgError');

async function getBalanceInUSerId(userId) {
    try {
        const row = await Balance.findOne({ where: { user_id: userId }, raw: true });
        return row?.price ?? 0;
    } catch (error) {
        throw error;
    }
}

async function getBalanceLogInUserId(filter) {
    try {
        const {
            userId,
            startDate,
            endDate,
            sort,
            sortBy,
            limit,
            page
        } = filter;

        const where = {
            [Op.or]: [{ sended_user_id: userId }, { confirmed_user_id: userId }],
        };

        if (startDate) where.created_at = { ...(where.created_at || {}), [Op.gte]: startDate };
        if (endDate) where.created_at = { ...(where.created_at || {}), [Op.lte]: endDate };

        const allowedSortBy = ['created_at', 'price', 'id'];
        const allowedSort = ['ASC', 'DESC'];

        const cleanSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
        const cleanSort = allowedSort.includes(sort?.toUpperCase()) ? sort.toUpperCase() : 'DESC';

        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        const parsedPage = page ? parseInt(page, 10) : 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const { rows, count: totalItems } = await BalanceTransaction.findAndCountAll({
            where,
            order: [[cleanSortBy, cleanSort]],
            limit: parsedLimit,
            offset,
            raw: true,
        });

        return {
            data: rows,
            pagination: {
                totalItems,
                currentPage: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(totalItems / parsedLimit),
                hasMore: parsedPage !== Math.ceil(totalItems / parsedLimit),
            }
        };

    } catch (error) {
        throw error;
    }
}

async function addBalanceInUser(data) {
    try {
        const {
            userId,
            price,
            sendedUserId,
            sendedName,
            confirmedName
        } = data;

        const result = await sequelize.transaction(async (t) => {
            const balanceRows = await sequelize.query(
                `INSERT INTO app_data.balance (user_id, price)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id)
                 DO UPDATE SET price = balance.price + EXCLUDED.price
                 RETURNING *;`,
                { bind: [userId, price], type: sequelize.QueryTypes.SELECT, transaction: t }
            );

            await sequelize.query(
                `INSERT INTO app_data.balance_tranzaksion (
                    sended_user_id,
                    confirmed_user_id,
                    sended_name,
                    confirmed_name,
                    price, is_added
                )
                VALUES ($1, $2, $3, $4, $5, $6);`,
                { bind: [sendedUserId, userId, sendedName, confirmedName, price, true], transaction: t }
            );

            return balanceRows[0];
        });

        return result;
    } catch (error) {
        throw error;
    }
}

// allowNegative: true lets the balance go below zero (debt) — used only for cash-ride
// commission, where the platform's cut must be collected even if the driver has no funds.
// Every other caller keeps the old "insufficient funds" guard, now enforced in application
// code (row-locked via SELECT ... FOR UPDATE) since app_data.balance no longer has a
// DB-level CHECK against negative values (see migrations/015_balance_allow_negative.sql).
async function removeBalanceInUSer(data, { allowNegative = false } = {}) {
    try {
        const {
            userId,
            price,
            sendedUserId,
            sendedName,
            confirmedName
        } = data;

        const result = await sequelize.transaction(async (t) => {
            await sequelize.query(
                `INSERT INTO app_data.balance (user_id, price)
                 VALUES ($1, 0)
                 ON CONFLICT (user_id) DO NOTHING;`,
                { bind: [userId], transaction: t }
            );

            if (!allowNegative) {
                const [current] = await sequelize.query(
                    `SELECT price FROM app_data.balance WHERE user_id = $1 FOR UPDATE;`,
                    { bind: [userId], type: sequelize.QueryTypes.SELECT, transaction: t }
                );

                if (Number(current.price) < Number(price)) {
                    throw new Error('Операция отклонена: недостаточно средств на балансе.');
                }
            }

            const balanceRows = await sequelize.query(
                `UPDATE app_data.balance
                 SET price = price - $2
                 WHERE user_id = $1
                 RETURNING *;`,
                { bind: [userId, price], type: sequelize.QueryTypes.SELECT, transaction: t }
            );

            await sequelize.query(
                `INSERT INTO app_data.balance_tranzaksion (
                    sended_user_id,
                    confirmed_user_id,
                    sended_name,
                    confirmed_name,
                    price, is_added
                )
                VALUES ($1, $2, $3, $4, $5, $6);`,
                { bind: [sendedUserId, userId, sendedName, confirmedName, price, false], transaction: t }
            );

            return balanceRows[0];
        });

        return result;
    } catch (error) {
        if (error.message === 'Операция отклонена: недостаточно средств на балансе.') {
            throw error;
        }

        const normalized = normalizePgError(error);

        if (normalized.code === '23514') {
            throw new Error('Операция отклонена: недостаточно средств на балансе.');
        }

        throw normalized;
    }

}

module.exports = {
    addBalanceInUser, removeBalanceInUSer,
    getBalanceInUSerId, getBalanceLogInUserId
}
