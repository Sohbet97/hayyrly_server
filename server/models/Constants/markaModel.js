const { Marka, CarModel, sequelize } = require('../../db');
const { normalizePgError } = require('../../db/pgError');

async function createNewMarka(image = null, name) {
    try {
        const row = await Marka.create({ name, image_url: image ?? null });
        const { id, name: n, image_url } = row.get({ plain: true });
        return { id, name: n, image_url };
    } catch (error) {
        throw error;
    }
}

async function getAllMarka() {
    try {
        const rows = await Marka.findAll({
            attributes: ['id', 'name', 'image_url'],
            order: [['id', 'DESC']],
            raw: true,
        });
        return rows;
    } catch (error) {
        throw error;
    }
}

async function deleteMarka(markaId) {
    try {
        const existing = await Marka.findByPk(markaId, {
            attributes: ['id', 'name', 'image_url'],
            raw: true,
        });
        if (!existing) {
            throw new Error('Marka not found');
        }
        await Marka.destroy({ where: { id: markaId } });
        return existing;
    } catch (error) {
        throw normalizePgError(error);
    }
}

async function updateMarka(markaId, newData) {
    try {
        const { name, image } = newData;
        const updates = {};

        if (name) updates.name = name;
        if (image) updates.image_url = image;

        if (Object.keys(updates).length === 0) {
            return { message: "Нет данных для обновления" };
        }

        const [, rows] = await Marka.update(updates, { where: { id: markaId }, returning: true });
        return rows[0]?.get({ plain: true });
    } catch (error) {
        throw normalizePgError(error);
    }
}

async function getMarkaTree() {
    try {
        const rows = await sequelize.query(
            `SELECT m.id, m.name, m.image_url, mo.id as model_id, mo.name as model_name
             FROM markas m
             LEFT JOIN models mo ON m.id = mo.marka_id`,
            { type: sequelize.QueryTypes.SELECT }
        );

        const tree = rows.reduce((acc, row) => {
            let marka = acc.find(item => item.id === row.id);

            if (!marka) {
                marka = {
                    id: row.id,
                    name: row.name,
                    image_url: row.image_url,
                    models: []
                };
                acc.push(marka);
            }

            if (row.model_id) {
                marka.models.push({
                    id: row.model_id,
                    name: row.model_name
                });
            }

            return acc;
        }, []);

        return tree;
    } catch (error) {
        console.error("Error building tree:", error);
        throw error;
    }
}


// models

async function createNewModel(data) {
    try {
        const { marka_id, name } = data;
        const row = await CarModel.create({ marka_id, name });
        const { id, marka_id: mId, name: n } = row.get({ plain: true });
        return { id, marka_id: mId, name: n };
    } catch (error) {
        throw error;
    }
}

async function deleteModel(modelId) {
    try {
        const existing = await CarModel.findByPk(modelId, { raw: true });
        if (!existing) {
            throw new Error("Модель не найдена");
        }
        await CarModel.destroy({ where: { id: modelId } });
        return { message: "Модель успешно удалена", deleted: existing };
    } catch (error) {
        throw normalizePgError(error);
    }
}

async function updateModel(modelId, newData) {
    try {
        const { name, marka_id } = newData;
        const updates = {};

        if (name) updates.name = name;
        if (marka_id) updates.marka_id = marka_id;

        if (Object.keys(updates).length === 0) return null;

        const [, rows] = await CarModel.update(updates, { where: { id: modelId }, returning: true });
        return rows[0]?.get({ plain: true });
    } catch (error) {
        throw normalizePgError(error);
    }
}


async function getModels(filter) {
    try {
        const { marka_id } = filter;
        const where = {};
        if (marka_id) where.marka_id = marka_id;

        const rows = await CarModel.findAll({ where, order: [['name', 'ASC']], raw: true });
        return rows;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    deleteMarka,
    getAllMarka,
    updateMarka,
    createNewMarka,

    getModels,
    updateModel,
    deleteModel,
    createNewModel,

    getMarkaTree

}
