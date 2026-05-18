const {pool} = require('../../config/db');

async function getBalanceInUSerId(data) {
    try {
        
    } catch (error) {
        
    }
}

async function getBalanceLogInUserId(filter) { 
    try {
        
    } catch (error) {
        
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