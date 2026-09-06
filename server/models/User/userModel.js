const { User, sequelize } = require('../../db');

async function getUserById(userId) {
    try {
        const rows = await sequelize.query(
            `SELECT u.*, COALESCE(b.price, 0.0) AS balance
            FROM users u
            LEFT JOIN balance b ON u.id = b.user_id
            WHERE u.id = $1`,
            { bind: [userId], type: sequelize.QueryTypes.SELECT }
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
            avatar,
            cityId
        } = newData;

        const fields = { updated_at: sequelize.literal('NOW()') };
        if (fullName !== undefined) fields.full_name = fullName;
        if (avatar !== undefined)   fields.avatar = avatar;
        if (cityId !== undefined)   fields.city_id = cityId;

        const [, rows] = await User.update(
            fields,
            { where: { id: userId }, returning: true }
        );
        return rows[0]?.get({ plain: true }) || null;
    } catch (error) {
        throw error;
    }
}

async function deleteUser(userId) {
    try {
        await User.destroy({ where: { id: userId } });
    } catch (error) {
        throw error;
    }
}

async function createNewUser(userData) {
    try {
        const row = await User.create({
            phone_number: userData.phone_number,
            firebase_uid: userData.firebase_uid,
            created_at: sequelize.literal('NOW()'),
            updated_at: sequelize.literal('NOW()'),
        });
        return row.get({ plain: true });
    } catch (error) {
        throw error;
    }
}

// Finds user by phone, creates if not exists
async function getOrCreateUserByPhoneNumber(phone_number, firebase_uid) {
    try {
        const rows = await sequelize.query(
            `WITH upserted_user AS (
                INSERT INTO users (phone)
                VALUES ($1)
                ON CONFLICT (phone)
                DO UPDATE SET updated_at = NOW()
                RETURNING *
            )
            SELECT u.*, COALESCE(b.price, 0.0) AS balance
            FROM upserted_user u
            LEFT JOIN balance b ON u.id = b.user_id;`,
            { bind: [phone_number], type: sequelize.QueryTypes.SELECT }
        );

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
