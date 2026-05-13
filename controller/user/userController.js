const UserModel = require('../../models/User/userModel');

async function getUserById(req, res) {
    try {
        const user = await UserModel.getUserById(req.params.id);
        if (!user) return res.status(404).json({ status: false, message: 'User not found' });
        return res.status(200).json({ status: true, user });
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Server error' });
    }
}

async function deleteUserData(req, res) {
    try {
        await UserModel.deleteUser(req.params.id);
        return res.status(200).json({ status: true, message: 'User deleted' });
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Server error' });
    }
}

async function createNewUser(req, res) {
    try {
        const user = await UserModel.createNewUser(req.body);
        return res.status(201).json({ status: true, user });
    } catch (error) {
        return res.status(500).json({ status: false, message: 'Server error' });
    }
}



module.exports = {
    deleteUserData,
    getUserById,
    createNewUser,
};
