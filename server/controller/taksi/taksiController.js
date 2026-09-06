const TaksiModel = require('../../models/Taksi/taksiModel');

async function createNewTaksi(req,res) { 
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
            taksiPark
        } = req.body;

        const avatar = req.files?.avatar?.[0]?.savedPath ?? null;
        const carImage = req.files?.carImage?.[0]?.savedPath ?? null;

        if(!firstName || !lastName || !phone || !birthday || !userId || !cityId || !autoNumber || !markaId || !modelId || !autoYear) {
            return res.status(409).json({
                status: false,
                message: 'Params Required'
            });
        }

        const data = {
            firstName, lastName, phone, birthday, userId, cityId, autoNumber, markaId, modelId, autoNumber, autoYear, isActive, 
            avatar, carImage, taksiPark
        };

        const result = await TaksiModel.createNewTaksi({data});

        return res.status(201).json({
            status: true, 
            result
        });
    } catch (error) {
        console.error('Error create New Taksi: ', error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });        
    }
    
}

async function getNearbyTaxis(req, res) {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ status: false, message: 'lat and lng are required' });
        }

        const result = await TaksiModel.getNearbyTaxis({
            lat:          parseFloat(lat),
            lng:          parseFloat(lng),
            radiusMeters: radius ? parseInt(radius) : 3000,
        });

        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error getNearbyTaxis:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getTaksiList(req,res) {
    try {

    } catch (error) {

    }

}

async function deleteTaksi(req,res) { 
    try {
        const id = req.params.id;
        if(!id) {
            return res.status(409).json({
                status: false,
                message: "Id Required"
            });
        }

        const result = await TaksiModel.deleteTaksi(id);
        return res.status(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error Delete Taksi: ', error);
        
    }
    
}

async function updateTaksi(req,res) {
    try {
        const id = req.params.id;
        if(!id) {
            return res.status(409).json({
                status: false,
                message: 'Id Required'
            });
        }

        const {
            firstName,
            lastName,
            phone,
            birthday,
            cityId,
            autoNumber,
            markaId,
            modelId,
            autoYear,
        } = req.body;

        const avatar = req.files?.avatar?.[0]?.savedPath ?? undefined;
        const carImage = req.files?.carImage?.[0]?.savedPath ?? undefined;

        const newData = {
            firstName, lastName, phone, birthday, cityId, autoNumber, markaId, modelId, autoYear,
            avatar, carImage,
        };

        const result = await TaksiModel.updateTaksi({ taksiId: id, newData });
        if (!result) return res.status(404).json({ status: false, message: 'Taksi not found' });

        return res.status(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error Update Taksi: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }

}

async function getTaksiByUserId(req, res) {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) return res.status(400).json({ status: false, message: 'Invalid userId' });

        const result = await TaksiModel.getTaksiByUserId(userId);
        if (!result) return res.status(404).json({ status: false, message: 'Taksi not found' });

        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error getTaksiByUserId:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getTaksiById(req, res) { 
    try {
        const id = req.params.id;

        if(!id) {
            return res.status(409).json({
                status: false, 
                message: 'Parametrs required'
            });
        }

        const result = await TaksiModel.getTaksiById(id);
        return res.status(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error get By Id: ', error);
        return res.status(500).json({
            status: false,
            message: 'INternal Server Error'
        });
        
    }
    
}

module.exports = {
    createNewTaksi,
    getNearbyTaxis,
    getTaksiList,
    deleteTaksi,
    updateTaksi,
    getTaksiByUserId,
    getTaksiById
};