const { pool } = require('../config/db');

let _io = null;

function init(io) {
    _io = io;
}

function send(toPhone, message) {
    if (!_io) return;
    _io.to('sms:gateway').emit('sms:send', { to: toPhone, message });
    console.log(`📱 SMS → ${toPhone}: ${message}`);
}

async function sendByUserId(userId, message) {
    const { rows } = await pool.query(
        'SELECT phone FROM users WHERE id = $1',
        [userId],
    );
    if (rows[0]?.phone) send(rows[0].phone, message);
}

async function sendByTaxiId(taxiId, message) {
    const { rows } = await pool.query(
        'SELECT phone FROM taxies WHERE id = $1',
        [taxiId],
    );
    if (rows[0]?.phone) send(rows[0].phone, message);
}

module.exports = { init, send, sendByUserId, sendByTaxiId };
