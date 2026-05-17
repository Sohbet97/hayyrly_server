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

        const avatar = req.files?.[0]?.savedPath ?? null;
        const carImage = req.files?.[1]?.savedPath ?? null;

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
        
    } catch (error) {
        
    }
    
}

module.exports = {
    createNewTaksi, 
    getTaksiList, 
    deleteTaksi, 
    updateTaksi
};