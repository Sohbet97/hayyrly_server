const CityModel = require('../../models/Constants/cityModel');

async function createNewCity(req, res) {
    try {
        const { nameTm, nameRu, nameEn, parentId } = req.body;


        if (!nameTm || !nameRu || !nameEn) {
            return res.status(400).json({
                status: false,
                message: 'All name parameters (TM, RU, EN) are required'
            });
        }

        const data = {
            name_tm: nameTm,
            name_ru: nameRu,
            name_en: nameEn,
            parent_id: (parentId && parentId !== "") ? parentId : null
        };

        const result = await CityModel.createNewCity({ data });

        return res.status(201).json({
            status: true,
            newCity: result
        });

    } catch (error) {
        console.error('Error in createNewCity controller:', error.message);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}

async function deleteCity(req, res) {
    try {
        const id = req.params.id;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: false,
                message: "Valid ID is required"
            });
        }

        const result = await CityModel.deleteCity(id);

        if (!result) {
            return res.status(404).json({
                status: false,
                message: "City not found"
            });
        }

        return res.status(200).json({
            status: true,
            message: "City deleted successfully",
            deletedCity: result
        });

    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                status: false,
                message: "Cannot delete city: it has linked addresses or sub-cities."
            });
        }

        console.error('Error in deleteCity controller:', error.message);
        return res.status(500).json({
            status: false,
            message: "Internal Server error"
        });
    }
}



async function updateCity(req, res) {
    try {
        // 1. Извлекаем ID из параметров URL и данные из тела запроса
        const { id } = req.params;
        const { nameTm, nameRu, nameEn, parentId } = req.body;

        // 2. Валидация: проверяем ID и наличие обязательных имен
        if (!id || isNaN(id)) {
            return res.status(400).json({
                status: false,
                message: "Valid ID is required in URL"
            });
        }

        if (!nameTm || !nameRu || !nameEn) {
            return res.status(400).json({
                status: false,
                message: "All name parameters (TM, RU, EN) are required for update"
            });
        }

        // 3. Формируем объект данных для модели (snake_case)
        const data = {
            name_tm: nameTm,
            name_ru: nameRu,
            name_en: nameEn,
            parent_id: (parentId && parentId !== "") ? parentId : null
        };

        // 4. Вызываем метод модели
        const result = await CityModel.updateCity({
            data: data,
            cityId: id
        });

        // 5. Если город с таким ID не найден
        if (!result) {
            return res.status(404).json({
                status: false,
                message: "City not found"
            });
        }

        // 6. Успешный ответ
        return res.status(200).json({
            status: true,
            message: "City updated successfully",
            updatedCity: result
        });

    } catch (error) {
        // Проверка на ошибку циклической зависимости (если parent_id = id)
        if (error.code === '23503' || error.code === '23514') {
            return res.status(400).json({
                status: false,
                message: "Invalid parent_id or constraint violation"
            });
        }

        console.error('Error Update City: ', error.message);

    }
}

async function getAllCity(req, res) {
    try {
        const result = await CityModel.getAllCities();
        return res.status(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error in getAllCities:', error.message);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });

    }

}

module.exports = {
    getAllCity,
    updateCity,
    createNewCity,
    deleteCity
};