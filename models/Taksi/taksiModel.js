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


async function getNearbyTaxis({ lat, lng, radiusMeters = 3000 }) {
    try {
        const query = `
            SELECT
                t.id,
                t.first_name,
                t.last_name,
                t.avatar,
                t.auto_number,
                t.marka_id,
                t.model_id,
                ST_Y(tl.location::geometry)  AS lat,
                ST_X(tl.location::geometry)  AS lng,
                ST_Distance(
                    tl.location,
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                )::int                       AS distance_m
            FROM app_data.taxies t
            JOIN app_data.taxies_locations tl ON tl.taxi_id = t.id
            WHERE ST_DWithin(
                tl.location,
                ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
                $3
            )
            ORDER BY distance_m
        `;
        const { rows } = await pool.query(query, [lat, lng, radiusMeters]);
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

async function getTaksiByUserId(userId) { 
    try {
        const query = 'SELECT * FROM taxies WHERE id = $1 LIMIT 1';
        // Деструктурируем rows (массив результатов) из ответа pool.query
        const { rows } = await pool.query(query, [userId]);

        // Проверяем длину массива. Если он пустой — значит такси с таким ID нет
        if (rows.length === 0) {
            return null;
        }
        
        // Возвращаем первую найденную запись (объект такси)
        return rows[0]; 
    } catch (error) {
        // Оставляем проброс ошибки, чтобы её можно было поймать выше (например, в контроллере)
        throw error;
    }
}

async function getTaksiById(taksiId) { 
    try {
        const query = 'SELECT * FROM taxies WHERE id = $1';
        const { rows } = await pool.query(query, [taksiId]);

        if( rows.length === 0) {
            return null;
        }

        return rows[0];
    } catch (error) {
        throw error;
    }
    
}

module.exports = {
    createNewTaksi,
    getNearbyTaxis,
    deleteTaksi,
    getTaksis,
    updateTaksi,
    getTaksiByUserId,
    getTaksiById
}