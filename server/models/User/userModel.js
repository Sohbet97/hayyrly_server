const { pool } = require('../../config/db');

async function getUserById(userId) {
    try {
        const { rows } = await pool.query(
            `SELECT u.*, COALESCE(b.price, 0.0) AS balance 
            FROM users u 
            LEFT JOIN balance b ON u.id = b.user_id 
            WHERE u.id = $1`,
            [userId]
        );

    return rows[0] || null;
        } catch (error) {
            throw error;
        }
}

async function updateuserData(userId, newData) {
    try {
        const {
            fullName,
            avatar
        } = newData;

        const { rows } = await pool.query(
            `UPDATE users SET full_name = $1, avatar = $2, updated_at = now() WHERE id = $3 
            RETURNING * `,
            [fullName, avatar, userId]
        );
        return rows[0] || null;
    } catch (error) {
        throw error;
    }
}

async function deleteUser(userId) {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    } catch (error) {
        throw error;
    }
}

async function createNewUser(userData) {
    try {
        const { rows } = await pool.query(
            `INSERT INTO users (phone_number, firebase_uid, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW()) RETURNING *`,
            [userData.phone_number, userData.firebase_uid]
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
}

// Finds user by phone, creates if not exists
async function getOrCreateUserByPhoneNumber(phone_number, firebase_uid) {
    try {
        const queryText = `
            WITH upserted_user AS (
                INSERT INTO users (phone)
                VALUES ($1)
                ON CONFLICT (phone)
                DO UPDATE SET updated_at = NOW()
                RETURNING *
            )
            SELECT u.*, COALESCE(b.price, 0.0) AS balance
            FROM upserted_user u
            LEFT JOIN balance b ON u.id = b.user_id;
        `;

        const { rows } = await pool.query(queryText, [phone_number]);
        return rows[0] || null;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createNewUser,
    deleteUser,
    updateuserData,
    getUserById,
    getOrCreateUserByPhoneNumber
};
