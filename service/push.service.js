const crypto = require('crypto');
const admin = require('../config/firebase');

const SECRET_KEY = crypto
    .createHash('sha256')
    .update(process.env.OTP_SECRET)
    .digest();

async function sendOtpPush(token, id, code, phone) {
    if (!token) return false;

    const encrypted = encrypt(String(code));
    try {
        await admin.messaging().send({
            token,
            data: {
                iv: encrypted.iv,
                data: encrypted.data,
                tag: encrypted.tag,
                otp_id: String(id),
                phone: String(phone),
            },
            android: {
                priority: 'high',
                ttl: 60 * 1000,
                collapseKey: `otp_${phone}`,
            },
        });
        return true;
    } catch (error) {
        console.log('FCM failed:', error.code, error.message);
        return false;
    }
}

function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        iv: iv.toString('base64'),
        data: encrypted.toString('base64'),
        tag: tag.toString('base64'),
    };
}

module.exports = { sendOtpPush, encrypt };
