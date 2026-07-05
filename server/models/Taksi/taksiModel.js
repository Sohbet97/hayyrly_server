const { Taxi, sequelize } = require('../../db');

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

        const row = await Taxi.create({
            first_name: firstName,
            last_name: lastName,
            phone,
            birthday,
            user_id: userId,
            city_id: cityId,
            avatar,
            auto_number: autoNumber,
            marka_id: markaId,
            model_id: modelId,
            auto_year: autoYear,
            auto_image: carImage,
            is_active: isActive,
            park: taksiPark,
        });
        return [row.get({ plain: true })];
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
        const rows = await sequelize.query(query, {
            bind: [lat, lng, radiusMeters],
            type: sequelize.QueryTypes.SELECT,
        });
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

async function updateTaksi({ newData }) {
    try {

    } catch (error) {
        throw error;
    }

}

async function deleteTaksi(taksiId) {
    try {
        const existing = await Taxi.findByPk(taksiId, { raw: true });
        if (!existing) {
            return [];
        }
        await Taxi.destroy({ where: { id: taksiId } });
        return [existing];
    } catch (error) {
        throw error;
    }
}

async function getTaksiByUserId(userId) {
    try {
        const row = await Taxi.findOne({ where: { user_id: userId }, raw: true });
        return row ?? null;
    } catch (error) {
        throw error;
    }
}

async function getTaksiById(taksiId) {
    try {
        const row = await Taxi.findByPk(taksiId, { raw: true });
        return row ?? null;
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
