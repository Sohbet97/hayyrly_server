const BalanModel = require('../../models/User/balanceModel');

async function addBalanceInUSer(req, res) { 
    try {
        const userId = req.params.id;
        const {
            price, 
            sendedUserId, 
            sendedName,       
            confirmedName 

        } = req.body;

        const data = {
            userId, 
            price, sendedUserId, sendedName, confirmedName
        };

        

        if(!userId || !sendedName || !sendedName || !confirmedName) {
            return res.status(409).json({
                status: false,
                message: 'Required params'
            });
        }

        const result = await BalanModel.addBalanceInUser(data);


        return res.status(201).json({
            status: true, 
            result
        });
        
    } catch (error) {
        console.error('Error add balance: ', error);
         if (error.code === '23514') {
             return res.status(500).json({
            status: false, 
            message: 'Операция отклонена: недостаточно средств на балансе.'
        })
     
    }
        return res.status(500).json({
            status: false, 
            message: 'Internal Server Error'
        });
        
    }
    
}

async function removeBalanceInUser(req, res) { 
    
     try {
        const userId = req.params.id;
        const {
            price, 
            sendedUserId, 
            sendedName,       
            confirmedName 
        } = req.body;

        const data = {
            userId, 
            price, sendedUserId, sendedName, confirmedName
        };       

        if(!userId || !sendedName || !sendedName || !confirmedName) {
            return res.status(409).json({
                status: false,
                message: 'Required params'
            });
        }

        const result = await BalanModel.removeBalanceInUSer(data);


        return res.status(201).json({
            status: true, 
            result
        });
        
    } catch (error) {
         console.error('Error add balance: ', error);
         if (error.code === '23514') {
             return res.status(500).json({
            status: false, 
            message: 'Операция отклонена: недостаточно средств на балансе.'
        })
     
    }
        return res.status(500).json({
            status: false, 
            message: error.message
        });
        
    
        
    }
}


async function getBalanceInUser(req, res) { 
    try {
        
    } catch (error) {
        console.error('Error get balance in user: ', error);
        return res.status(500).json({
            status: false, 
            message: 'Internal Server Error'
        });
        
    }
    
}

module.exports = {
    removeBalanceInUser, addBalanceInUSer, getBalanceInUser
}