const MarkaModel = require('../../models/Constants/markaModel');


async function getAllMarkaAndMode(req, res) {
    try {
        const result = await MarkaModel.getMarkaTree();
        return res.status(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error Get Tree Marka: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });

    }

}

async function createNewMarka(req, res) {
    try {
        const image = req.files?.[0]?.savedPath ?? null;
        const name = req.body.name;
        if (!name) {
            return res.status(409).json({
                status: false,
                mesage: "Name required"
            });
        }
      
        const result = await MarkaModel.createNewMarka(image, name);
        return res.status(201).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error Create Marka: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }

}

async function updateMarka(req, res) {
    try {
        console.log(req.body);
        
        const image = req.files?.[0]?.savedPath ?? null;
        const id = req.params.id;
        const name = req.body.name;

        

        const data = {
            name, image
        };
        if (!id) {
            return res.status(409).json({
                status: false,
                message: "Id Required"
            });
        }
        const result = await MarkaModel.updateMarka(id, data);
        return res.statu(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error Get Tree Marka: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }

}

async function deleteMarka(req, res) {
    try {
        const id = req.params.id;
        
        if (!id) {
            return res.status(409).json({
                status: false,
                message: "Id Required"
            });
        };

        const result = await MarkaModel.deleteMarka(id);
        return res.status(200).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error Delete Marka: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }

}


// models
async function createNewMode(req, res) {
    try {
        const {
            markaId, name
        } = req.body;

        if(!name || !markaId) {
            return res.status(409).json({
                status: false,
                message: 'params required'
            });
        } 
        const data = {
            marka_id : markaId,
            name: name
        };
        const result = await MarkaModel.createNewModel(data);
        return res.status(201).json({
            status: true,
            result
        });
    } catch (error) {
        console.error('Error Create New Model', error);
        return res.status(500).json({
            status: false,
            mesage : "Internal Server Error"
        });
        
    }

}

async function updateModel(req, res) {
    try {
        const id = req.params.id;
        const name = req.body;
        if(!id || !name) {
            return res.status(400).json({
                status: false,
                messae: "Params Required"
            });
        }

        const resutlt = await MarkaModel.updateModel(id, {name});
        return res.status(200).json({
            status: true, 
            resutlt
        });
    } catch (error) {
console.error('Error Create New Model', error);
        return res.status(500).json({
            status: false,
            mesage : "Internal Server Error"
        });
    }

}

async function deleteModel(req, res) {
    try {
        const id = req.params.id;
        if(!id) {
            return res.status(409).json({
                status: false,
                message: "Params Required"
            });

        }

        const result = await MarkaModel.deleteModel(id);
        return res.status(200).json({
            status: true, 
            result
        });
    } catch (error) {
    console.error('Error Create New Model', error);
        return res.status(500).json({
            status: false,
            mesage : "Internal Server Error"
        });
    }

}

async function getAllModes(req, res) {
    try {
        const {markaId} = req.query;
        const filter = {marka_id : markaId};
        const result = await MarkaModel.getModels(filter);
        return res.status(200).json({
            status: true, 
            result
        });
    } catch (error) {
console.error('Error Create New Model', error);
        return res.status(500).json({
            status: false,
            mesage : "Internal Server Error"
        });
    }

}

module.exports = {
    getAllMarkaAndMode,
    createNewMarka,
    updateMarka,
    deleteMarka,

    getAllModes,
    createNewMode,
    updateModel,
    deleteModel
}