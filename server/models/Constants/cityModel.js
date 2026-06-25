const { pool } = require('../../config/db');


function buildCityTree(cities) {
    const map = {};
    const tree = [];
    cities.forEach(city => {
        map[city.id] = { ...city, children: [] };
    });


    cities.forEach(city => {
        if (city.parent_id && map[city.parent_id]) {

            map[city.parent_id].children.push(map[city.id]);
        } else {
            tree.push(map[city.id]);
        }
    });
    return tree;
}

async function createNewCity({ data }) {
    const { name_tm, name_ru, name_en, parent_id } = data;
    const query = `
        INSERT INTO cities (name_tm, name_ru, name_en, parent_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    try {
        const res = await pool.query(query, [name_tm, name_ru, name_en, parent_id || null]);
        return res.rows[0];
    } catch (error) {
        throw error;
    }
}

async function getAllCities() {
    const query = 'SELECT id, name_tm, name_ru, name_en, parent_id  FROM cities ORDER BY id ASC;';
    try {
        const res = await pool.query(query);

        const tree = buildCityTree(res.rows);

        return {
            cities: res.rows,
            tree: tree
        }
    } catch (error) {
        throw error;
    }
}

async function deleteCity(cityId) {
    const query = 'DELETE FROM cities WHERE id = $1 RETURNING *;';
    try {
        const res = await pool.query(query, [cityId]);
        if (res.rowCount === 0) {
            throw new Error('City not found');
        }
        return res.rows[0];
    } catch (error) {
        throw error;
    }
}

async function updateCity({ data, cityId }) {
    const { name_tm, name_ru, name_en, parent_id } = data;
    const query = `
        UPDATE cities 
        SET name_tm = $1, name_ru = $2, name_en = $3, parent_id = $4
        WHERE id = $5
        RETURNING *;
    `;
    try {
        const res = await pool.query(query, [name_tm, name_ru, name_en, parent_id || null, cityId]);
        if (res.rowCount === 0) {
            throw new Error('City not found');
        }
        return res.rows[0];
    } catch (error) {
        console.error('Error in updateCity:', error.message);
        throw error;
    }
}

module.exports = {
    createNewCity,
    updateCity,
    deleteCity,
    getAllCities
};