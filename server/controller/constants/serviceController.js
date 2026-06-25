const ServiceModel = require('../../models/Constants/serviceModel');


async function getAllServices(req,res) { 
    try {
        const result = await ServiceModel.getAllServices();
        return res.status(200).json({
            result
        });
    } catch (error) {
        console.error('error get All Services: ', error);
        return res.status(500).json({
            status: false, 
            message: "Internal Server Error"
        });        
    }
    
}

async function deleteService(req,res) { 
    try {
        const id = req.params.id;

        if(!id) {
            return res.status(409).json({
                status: false, 
                message: "Params Required"
            });
        }
        const result = await ServiceModel.deleteService(id);
        return res.status(200).json({
            result
        });
    } catch (error) {
        console.error('error Delete Services: ', error);
        return res.status(500).json({
            status: false, 
            message: "Internal Server Error"
        });        
    }
    
}

async function updateService(req,res) { 
    try {
        const id = req.params.id;

        const {
            nameTm, nameRu, nameEn, emoji
        } = req.body;


        if(!id) {
            return res.status(409).json({
                status: false, 
                message: "Params Required"
            });
        }
        const data = {
            id, nameEn, nameTm, nameRu, emoji
        }
        const result = await ServiceModel.updateService(data);
        return res.status(200).json({
            result
        });
    } catch (error) {
        console.error('error Update Services: ', error);
        return res.status(500).json({
            status: false, 
            message: "Internal Server Error"
        });        
    }
    
}


async function createService(req,res) { 
    try {

        const {
            nameTm, nameRu, nameEn, emoji
        } = req.body;


        
        const data = {
            nameEn, nameTm, nameRu, emoji
        }
        const result = await ServiceModel.createNewService(data);
        return res.status(200).json({
            result
        });
    } catch (error) {
        console.error('error Create New Services: ', error);
        return res.status(500).json({
            status: false, 
            message: "Internal Server Error"
        });        
    }
    
}

module.exports = {
    createService, getAllServices, updateService, deleteService
};


