const {pool} = require('../../config/db');


async function getAllServices() {
    try {
        const query = `SELECT * FROM services ORDER BY id ASC;`;
        const res = await pool.query(query,[]);
        return res.rows;
    } catch (error) {
        throw error;
    }
    
}

async function deleteService(serviceID) { 
    try {
        const query = `DELETE FROM services WHERE id = $1;`
        const res = await pool.query(query, [serviceID]);
         if (res.rowCount === 0) {
            throw new Error('Service not found');
        }
        return res.rows[0];
    } catch (error) {
        
    }
    
}

async function updateService(data) { 
    try {
        const {nameTm, nameRu, nameEn, emoji, id} = data;
        const query = `UPDATE services SET name_tm = $1, name_ru = $2, 
            name_en = $3, emoji = $4 WHERE id =$5 RETURNING *;`;
            const res = await pool.query(query, [
                nameTm, nameRu, nameEn, emoji, id
            ]);

            if(res.rows === 0) {
                throw new Error('Service Not Found');
            }
            return res.rows[0];
    } catch (error) {
        throw error;
    }
    
}

async function createNewService(data) { 
    try {
        const {nameTm, nameRu, nameEn, emoji} = data;
        const query = `INSERT INTO services (name_tm, name_ru, name_en, emoji)
            VALUES ($1, $2, $3, $4) RETURNING *;`;
            const res = await pool.query(query, [nameTm, nameRu, nameEn, emoji]);
            return res.rows[0];
    } catch (error) {
        throw error;
        
    }
    
}

module.exports = {
    getAllServices, createNewService, updateService, deleteService
};