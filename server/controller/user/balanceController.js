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

async function getBalanceInUserId(req, res) {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ status: false, message: 'Invalid user ID format' });
        }

        const price = await BalanModel.getBalanceInUSerId(userId);
        return res.status(200).json({ status: true, result: { userId, price } });
    } catch (error) {
        console.error('Error get balance for user: ', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getLogByUser(req, res) {
    try {
        // 1. Convert string ID to Integer
        const userId = parseInt(req.params.id, 10);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid user ID format'
            });
        }

        // 2. Read from req.query (Recommended for GET requests)
        // If you strictly use POST, you can keep req.body here
        const {
            startDate, endDate, sortBy, sort, limit, page
        } = req.query; 

        const filter = {
            startDate : startDate ?? null, 
            endDate : endDate ?? null, 
            sortBy : sortBy ?? null, 
            sort : sort ?? null,
            limit: limit ? parseInt(limit, 10) : 10, 
            page: page ? parseInt(page, 10) : 1,
            userId : userId
        };

        // Double check your model name spelling (BalanModel vs BalanceModel)
        const result = await BalanModel.getBalanceLogInUserId(filter);
        
        return res.status(200).json({
            status: true, 
            result
        });
    } catch (error) {
        console.error('Error get balance in user: ', error);
        return res.status(500).json({
            status: false, 
            message: 'Internal Server Error'
        });
    }
}

module.exports = {
    removeBalanceInUser, addBalanceInUSer, getLogByUser, getBalanceInUserId
}