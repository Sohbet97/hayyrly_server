const { Op } = require('sequelize');
const { OtpCode, sequelize } = require('../../db');

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

async function createNewCode(phone) {
    const code = generateCode();

    // Kept as raw SQL: this exact INSERT/UPDATE on otp_codes is what the DB trigger
    // listens on to fire NOTIFY otp_channel (see server.js startOtpListener).
    const query = `
        INSERT INTO otp_codes (phone, code)
        VALUES ($1, $2)
        ON CONFLICT (phone)
        DO UPDATE SET
            code = EXCLUDED.code,
            created_at = NOW(),
            is_used = false,
            is_sended = false
        RETURNING id, code;
    `;

    try {
        const rows = await sequelize.query(query, { bind: [phone, code], type: sequelize.QueryTypes.SELECT });
        return rows[0];
    } catch (error) {
        console.error('Database error in createNewCode:', error.message);
        throw error;
    }
}

async function verifyCode(phone, code) {
    const row = await OtpCode.findOne({
        where: {
            phone,
            code,
            is_used: false,
            created_at: { [Op.gt]: sequelize.literal("NOW() - INTERVAL '5 minutes'") },
        },
        order: [['created_at', 'DESC']],
        raw: true,
    });
    return row || null;
}

async function deleteCode(id) {
    await OtpCode.destroy({ where: { id } });
}

module.exports = { createNewCode, verifyCode, deleteCode };
