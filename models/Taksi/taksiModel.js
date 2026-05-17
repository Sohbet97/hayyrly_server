const {pool} = require('../../config/db');

async function createNewTaksi({
    data
}) { 
    try {
        const {
            firstName, 
            lastName,
            phone,
            birthday,
            userId,
            cityId,
            autoNumber,
            markaId,
            modelId,
            autoYear,
            isActive,
            avatar, 
            carImage,
            taksiPark
        } = data;

        const query = `
        INSERT INTO  app_data.taxies(
	        first_name, last_name, phone, birthday, user_id, city_id, avatar, auto_number, marka_id, model_id, auto_year, auto_image, is_active, park)
	    VALUES( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING * ;`
        const values = [
            firstName, lastName, phone, birthday, userId, cityId, avatar, autoNumber, markaId, modelId, autoYear, carImage, isActive, taksiPark
        ];
        const { rows } = await pool.query(query, values);
        return rows;
    } catch (error) {
        throw error;
    }
    
}


async function getTaksis(filter) { 
    try {
        
    } catch (error) {
        throw error;
    }
    
}

async function updateTaksi({newData}) { 
    try {
        
    } catch (error) {
        throw error;
    }
    
}

async function deleteTaksi(taksiId) { 
    try {
        const query = `DELETE FROM taxies WHERE id = $1 RETURNING *`;
        const {rows} = await pool.query(query,[taksiId]);
        return rows;
    } catch (error) {
        throw error;
    }    
}

module.exports = {
    createNewTaksi, 
    deleteTaksi, 
    getTaksis, 
    updateTaksi
}