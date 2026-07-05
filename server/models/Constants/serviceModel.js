const { Service } = require('../../db');

async function getAllServices() {
    try {
        const rows = await Service.findAll({ order: [['id', 'ASC']], raw: true });
        return rows;
    } catch (error) {
        throw error;
    }
}

async function deleteService(serviceID) {
    try {
        const destroyed = await Service.destroy({ where: { id: serviceID } });
        if (destroyed === 0) {
            throw new Error('Service not found');
        }
        // Original DELETE had no RETURNING clause, so it always returned undefined here.
        return undefined;
    } catch (error) {
        // Original catch block was empty — swallows all errors, including "not found".
    }
}

async function updateService(data) {
    try {
        const { nameTm, nameRu, nameEn, emoji, id } = data;
        const [, rows] = await Service.update(
            { name_tm: nameTm, name_ru: nameRu, name_en: nameEn, emoji },
            { where: { id }, returning: true }
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
}

async function createNewService(data) {
    try {
        const { nameTm, nameRu, nameEn, emoji } = data;
        const row = await Service.create({ name_tm: nameTm, name_ru: nameRu, name_en: nameEn, emoji });
        return row.get({ plain: true });
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getAllServices, createNewService, updateService, deleteService
};
