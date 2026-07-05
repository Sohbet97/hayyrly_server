const { User, Taxi } = require('../db');

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
    const row = await User.findByPk(userId, { attributes: ['phone'], raw: true });
    if (row?.phone) send(row.phone, message);
}

async function sendByTaxiId(taxiId, message) {
    const row = await Taxi.findByPk(taxiId, { attributes: ['phone'], raw: true });
    if (row?.phone) send(row.phone, message);
}

module.exports = { init, send, sendByUserId, sendByTaxiId };
