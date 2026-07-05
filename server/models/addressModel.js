const { Address } = require('../db');
const { Op } = require('sequelize');

async function createNewAddress(data) {
    try {
        const {
            userId,
            cityId,
            address,
            latitude,
            longitude
        } = data;

        const row = await Address.create({
            user_id: userId,
            city_id: cityId,
            address,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
        });

        return row.get({ plain: true });

    } catch (error) {
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

        // WHERE id = addressId AND user_id = userId, so a user can't update another user's address.
        const [affected, rows] = await Address.update(
            {
                address,
                city_id: cityId,
                latitude: latitude ?? null,
                longitude: longitude ?? null,
            },
            { where: { id: addressId, user_id: userId }, returning: true }
        );

        if (affected === 0) {
            return null;
        }

        return rows[0].get({ plain: true });

    } catch (error) {
        console.error("Error in updateAddress:", error.message);
        throw error;
    }
}

async function deleteAddress(addressId) {
    try {
        await Address.destroy({ where: { id: addressId } });
        // Original DELETE had no RETURNING clause, so it always returned an empty array.
        return [];
    } catch (error) {
        throw error;

    };

}

async function getAddress(filter) {
    try {
        const { search, userId, cityId, limit, offset } = filter;

        const where = {};

        if (userId) where.user_id = userId;
        if (cityId) where.city_id = cityId;
        if (search) where.address = { [Op.iLike]: `%${search}%` };

        const total = await Address.count({ where });

        const rows = await Address.findAll({
            where,
            order: [['id', 'DESC']],
            limit,
            offset,
            raw: true,
        });

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
