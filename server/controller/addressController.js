const AddressModel = require('../models/addressModel');

async function createNewAddress(req, res) {
    try {
        const {
            userId,
            cityId,
            address,
            latitude,
            longitude
        } = req.body;

        if (!userId || !cityId || !address) {
            return res.status(409).json({
                status: false,
                message: "Params Required"
            });
        }

        const data = {
            userId,
            cityId,
            address,
            latitude,
            longitude
        };
        const result = await AddressModel.createNewAddress(data);
        return res.status(201).json({
            status: true,
            message: result
        });
    } catch (error) {
        console.error('Error create new address: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server  Error'
        });

    }

}

async function updateAddress(req, res) {
    try {
        // 1. Извлекаем данные из тела запроса и ID пользователя из токена (если есть)
        const {
            userId,
            address,
            cityId,
            latitude,
            longitude
        } = req.body;

        // Предполагаем, что userId берется из middleware авторизации (например, req.user.id)
        const addressId = req.params.id;

        // Валидация входных данных
        if (!addressId || !address || !cityId) {
            return res.status(400).json({
                success: false,
                message: "addressId, address and cityId are required"
            });
        }

        // 2. Вызываем функцию обновления (которую мы написали ранее)
        const updatedAddress = await AddressModel.updateAddress({
            addressId,
            address,
            userId,
            cityId,
            latitude,
            longitude
        });

        // 3. Проверяем результат
        if (!updatedAddress) {
            return res.status(404).json({
                success: false,
                message: "Address not found or access denied"
            });
        }

        // 4. Успешный ответ
        return res.status(200).json({
            success: true,
            data: updatedAddress
        });

    } catch (error) {
        console.error("Controller Error (updateAddress):", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

async function deleteAddress(req, res) {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(409).json({
                status: false,
                message: 'Id Required'
            });
        }

        const result = await AddressModel.deleteAddress(id);
        return res.status(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error delete Address: ', error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });

    }

}
async function getAddress(req, res) {
    try {
        const {
            search,
            userId, // Если это админ-панель. Если клиентское приложение — лучше req.user.id
            cityId,
            limit,
            page
        } = req.query;

        // Преобразование в числа, чтобы избежать ошибок в SQL-запросе
        const lim = parseInt(limit) || 50;
        const pag = parseInt(page) || 0;
        const offset = pag * lim;

        const filter = {
            search: search ? `%${search}%` : null, // Подготовка для ILIKE
            userId: userId ? parseInt(userId) : null,
            cityId: cityId ? parseInt(cityId) : null,
            limit: lim,
            offset: offset // Передаем уже рассчитанный сдвиг
        };

        const result = await AddressModel.getAddress(filter);

        return res.status(200).json({
            status: true,
            data: result['addresses'],
            total: result['total'],
            hasMore: result['hasMore']

        });

    } catch (error) {
        console.error('Error Get Address: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
}

module.exports = {
    getAddress,
    createNewAddress,
    deleteAddress,
    updateAddress
};