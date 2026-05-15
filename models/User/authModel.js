const { pool } = require('../../config/db');

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

async function createNewCode(phone) {
    const code = generateCode();
    const query = `
        INSERT INTO otp_codes (phone, code)
        VALUES ($1, $2)
        ON CONFLICT (phone)
        DO UPDATE SET 
            code = EXCLUDED.code, 
            created_at = NOW(),
            is_used = false
        RETURNING id, code;
    `;

    try {
        const { rows } = await pool.query(query, [phone, code]);
        return rows[0];
    } catch (error) {
        console.error('Database error in createNewCode:', error.message);
        throw error;
    }
}

async function verifyCode(phone, code) {
    const { rows } = await pool.query(
        `SELECT id FROM otp_codes
         WHERE phone = $1
           AND code  = $2
           AND is_used = FALSE
           AND created_at > NOW() - INTERVAL '5 minutes'
         ORDER BY created_at DESC
         LIMIT 1`,
        [phone, code]
    );
    return rows[0] || null;
}

async function deleteCode(id) {
    await pool.query(
        `DELETE FROM otp_codes WHERE id = $1`,
        [id]
    );
}

module.exports = { createNewCode, verifyCode, deleteCode };
