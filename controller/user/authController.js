const jwt = require('jsonwebtoken');
const AuthModel = require('../../models/User/authModel');
const UserModel = require('../../models/User/userModel');
const TaksiModel = require('../../models/Taksi/taksiModel');

async function generateAdnSendOtp(req, res) {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ status: false, message: 'phone required' });
        }

        await AuthModel.createNewCode(phone);

        return res.status(200).json({ status: true, message: 'OTP sent' });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

async function verificationOtp(req, res) {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ status: false, message: 'phone and code required' });
        }

     

        const otp = await AuthModel.verifyCode(phone, code);
        if (!otp) {
            return res.status(400).json({ status: false, message: 'Invalid or expired code' });
        }

        await AuthModel.deleteCode(otp.id);

        const user = await UserModel.getOrCreateUserByPhoneNumber(phone, null);
        const userId = user.id;
        const taksi = await TaksiModel.getTaksiByUserId(userId);

        const token = jwt.sign(
            { id: user.id, phone: user.phone_number },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.status(200).json({ status: true, token, user, taksi });
    } catch (error) {
        console.error('Error verification code: ', error);
        
        return res.status(500).json({ status: false, message: error.message });
    }
}

module.exports = { verificationOtp, generateAdnSendOtp };
