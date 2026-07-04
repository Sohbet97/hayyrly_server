const { City } = require('../../db');
const { normalizePgError } = require('../../db/pgError');

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
    try {
        const row = await City.create({ name_tm, name_ru, name_en, parent_id: parent_id || null });
        return row.get({ plain: true });
    } catch (error) {
        throw error;
    }
}

async function getAllCities() {
    try {
        const rows = await City.findAll({
            attributes: ['id', 'name_tm', 'name_ru', 'name_en', 'parent_id'],
            order: [['id', 'ASC']],
            raw: true,
        });

        const tree = buildCityTree(rows);

        return {
            cities: rows,
            tree: tree
        }
    } catch (error) {
        throw error;
    }
}

async function deleteCity(cityId) {
    try {
        const existing = await City.findByPk(cityId, { raw: true });
        if (!existing) {
            throw new Error('City not found');
        }
        await City.destroy({ where: { id: cityId } });
        return existing;
    } catch (error) {
        throw normalizePgError(error);
    }
}

async function updateCity({ data, cityId }) {
    const { name_tm, name_ru, name_en, parent_id } = data;
    try {
        const [affected, rows] = await City.update(
            { name_tm, name_ru, name_en, parent_id: parent_id || null },
            { where: { id: cityId }, returning: true }
        );
        if (affected === 0) {
            throw new Error('City not found');
        }
        return rows[0].get({ plain: true });
    } catch (error) {
        console.error('Error in updateCity:', error.message);
        throw normalizePgError(error);
    }
}

module.exports = {
    createNewCity,
    updateCity,
    deleteCity,
    getAllCities
};
