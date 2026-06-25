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
async function updateuserData(req, res) {
    try {
        const userId = req.params.id;
        const {
            fullName,
        } = req.body;

        const avatar = req.files?.[0]?.savedPath ?? null;

        const data = {
            fullName: fullName,
            avatar: avatar
        }

        const result = await UserModel.updateuserData(userId, data);

        return res.status(200).json({
            status: true,
            result
        });



    } catch (error) {
        console.log("Error Update User: ", error);

        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }

}



module.exports = {
    deleteUserData,
    getUserById,
    createNewUser,
    updateuserData
};
