const {pool} = require('../../config/db');

async function getBalanceInUSerId(data) {
    try {
        
    } catch (error) {
        
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

        let queryText = `
            SELECT * FROM app_data.balance_tranzaksion 
            WHERE (sended_user_id = $1 OR confirmed_user_id = $1)
        `;
        const queryParams = [userId];
        let paramIndex = 2;


        if (startDate) {
            queryText += ` AND created_at >= $${paramIndex}`;
            queryParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            queryText += ` AND created_at <= $${paramIndex}`;
            queryParams.push(endDate);
            paramIndex++;
        }


        const allowedSortBy = ['created_at', 'price', 'id'];
        const allowedSort = ['ASC', 'DESC'];

        const cleanSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at';
        const cleanSort = allowedSort.includes(sort?.toUpperCase()) ? sort.toUpperCase() : 'DESC';

        queryText += ` ORDER BY ${cleanSortBy} ${cleanSort}`;

        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        const parsedPage = page ? parseInt(page, 10) : 1;
        const offset = (parsedPage - 1) * parsedLimit;

        queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parsedLimit, offset);

        const { rows } = await pool.query(queryText, queryParams);

        let countQueryText = `
            SELECT COUNT(*) FROM app_data.balance_tranzaksion 
            WHERE (sended_user_id = $1 OR confirmed_user_id = $1)
        `;
        const countParams = [userId];
        let countParamIndex = 2;

        if (startDate) {
            countQueryText += ` AND created_at >= $${countParamIndex}`;
            countParams.push(startDate);
            countParamIndex++;
        }
        if (endDate) {
            countQueryText += ` AND created_at <= $${countParamIndex}`;
            countParams.push(endDate);
        }

        const countResult = await pool.query(countQueryText, countParams);
        const totalItems = parseInt(countResult.rows[0].count, 10);

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
    const client = await pool.connect();
    
    try {
        const {
            userId, 
            price, 
            sendedUserId, 
            sendedName,       
            confirmedName     
        } = data;

        await client.query('BEGIN');

        const balanceQuery = `
            INSERT INTO app_data.balance (user_id, price) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id) 
            DO UPDATE SET price = balance.price + EXCLUDED.price
            RETURNING *;
        `;
        const balanceValues = [userId, price];
        const balanceResult = await client.query(balanceQuery, balanceValues);

        const logQuery = `
            INSERT INTO app_data.balance_tranzaksion (
                sended_user_id, 
                confirmed_user_id, 
                sended_name, 
                confirmed_name, 
                price, is_added
            ) 
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        const logValues = [
            sendedUserId, 
            userId, 
            sendedName, 
            confirmedName, 
            price,
            true
        ];
        await client.query(logQuery, logValues);

        await client.query('COMMIT');
        
        return balanceResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');

       

        throw error;
    } finally {
        client.release();
    }
}

async function removeBalanceInUSer(data) {
    const client = await pool.connect();
    
    try {
        const {
            userId, 
            price, 
            sendedUserId, 
            sendedName,       
            confirmedName     
        } = data;

        await client.query('BEGIN');

        const balanceQuery = `
            INSERT INTO app_data.balance (user_id, price) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id) 
            DO UPDATE SET price = balance.price - EXCLUDED.price
            RETURNING *;
        `;
        const balanceValues = [userId, price];
        const balanceResult = await client.query(balanceQuery, balanceValues);

        const logQuery = `
            INSERT INTO app_data.balance_tranzaksion (
                sended_user_id, 
                confirmed_user_id, 
                sended_name, 
                confirmed_name, 
                price, is_added
            ) 
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        const logValues = [
            sendedUserId, 
            userId, 
            sendedName, 
            confirmedName, 
            price,
            false
        ];
        await client.query(logQuery, logValues);

        await client.query('COMMIT');
        
        return balanceResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');

        if (error.code === '23514') {
        throw new Error('Операция отклонена: недостаточно средств на балансе.');
    }

       

        throw error;
    } finally {
        client.release();
    }
    
}

module.exports = {
    addBalanceInUser, removeBalanceInUSer, 
    getBalanceInUSerId, getBalanceLogInUserId
}