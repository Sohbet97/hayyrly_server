const db = require('../config/db');

async function createNewAddress(data) {
    try {
        const {
            userId,
            cityId,
            address,
            latitude,
            longitude
        } = data;

        // 1. Исправлено RETURNING
        const query = `
            INSERT INTO address (user_id, city_id, address, latitude, longitude) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`;

        const values = [
            userId,
            cityId,
            address,
            latitude ?? null,
            longitude ?? null
        ];

        const { rows } = await db.pool.query(query, values);

        // 2. Проверка, что запись действительно создана
        if (rows.length === 0) {
            return null;
        }

        return rows[0];

    } catch (error) {
        // Логируем ошибку для дебага, прежде чем пробрасывать дальше
        console.error("Error in createNewAddress:", error.message);
        throw error;
    }
}

async function updateAddress(data) {
    try {
        const {
            addressId,
            address,
            userId,
            cityId,
            latitude,
            longitude
        } = data;

        // Используем WHERE id = $1 AND user_id = $3, чтобы пользователь 
        // не мог случайно или намеренно обновить чужой адрес.
        const query = `
            UPDATE address 
            SET 
                address = $2, 
                city_id = $4, 
                latitude = $5, 
                longitude = $6
                
            WHERE id = $1 AND user_id = $3
            RETURNING *`;

        const values = [
            addressId,      // $1
            address,        // $2
            userId,         // $3
            cityId,         // $4
            latitude ?? null,
            longitude ?? null
        ];

        const { rows } = await db.pool.query(query, values);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];

    } catch (error) {
        console.error("Error in updateAddress:", error.message);
        throw error;
    }
}

async function deleteAddress(addressId) {
    try {
        const query = 'DELETE FROM address WHERE id = $1';
        const { rows } = await db.pool.query(query, [addressId]);
        return rows;
    } catch (error) {
        throw error;

    };

}

async function getAddress(filter) {
    try {
        const { search, userId, cityId, limit, offset } = filter;

        let conditions = [];
        let values = [];

        // 1. Сборка условий WHERE
        if (userId) {
            values.push(userId);
            conditions.push(`user_id = $${values.length}`);
        }

        if (cityId) {
            values.push(cityId);
            conditions.push(`city_id = $${values.length}`);
        }

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`address ILIKE $${values.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 2. Запрос на общее количество (total) без учета LIMIT и OFFSET
        const countQuery = `SELECT COUNT(*) FROM address ${whereClause}`;
        const countRes = await db.pool.query(countQuery, values);
        const total = parseInt(countRes.rows[0].count);

        // 3. Запрос на получение данных
        const dataQuery = `
            SELECT * FROM address 
            ${whereClause} 
            ORDER BY id DESC 
            LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

        const dataValues = [...values, limit, offset];
        const { rows } = await db.pool.query(dataQuery, dataValues);

        // 4. Логика hasMore
        // Если текущий сдвиг + количество полученных строк меньше общего количества, значит есть еще данные
        const hasMore = offset + rows.length < total;

        return {
            addresses: rows,
            total,
            hasMore
        };

    } catch (error) {
        console.error("Model Error (getAddress):", error.message);
        throw error;
    }
}

module.exports = {
    getAddress,
    deleteAddress,
    updateAddress,
    createNewAddress
};