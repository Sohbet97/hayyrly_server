const SosModel = require('../models/Sos/sosModel');
const { verifyAdminToken } = require('../middleware/adminAuth');

function err(socket, message) {
    socket.emit('sos:error', { message });
}

// Client/driver triggers an emergency alert — persist + notify any admins watching.
async function handleSosTrigger(io, socket, data) {
    const { orderId, userId, taxiId, phone, note, lat, lng } = data;

    if (!phone || lat == null || lng == null) {
        return err(socket, 'phone, lat, lng are required');
    }

    const alert = await SosModel.createSosAlert({
        orderId: orderId ?? null,
        userId:  userId  ?? null,
        taxiId:  taxiId  ?? null,
        phone, note: note ?? null, lat, lng,
    });

    io.to('admin:sos').emit('sos:alert', alert);
    socket.emit('sos:triggered', alert);

    console.log(`🆘 SOS alert ${alert.id} | phone ${phone}`);
}

// Admin panel socket authenticates and joins the realtime broadcast rooms
// (SOS alerts, support chat — server/socket/supportSocket.js emits into 'admin:support',
// new orders — server/socket/orderSocket.js emits into 'admin:orders').
async function handleAdminRegister(socket, data) {
    const admin = await verifyAdminToken(data?.token);
    if (!admin) return err(socket, 'Invalid admin token');

    socket.join('admin:sos');
    socket.join('admin:support');
    socket.join('admin:orders');
    socket.emit('admin:registered', { adminId: admin.id });
}

function initSosSocket(io, socket) {
    const wrap = (name, fn) => socket.on(name, async (data) => {
        try { await fn(io, socket, data); }
        catch (e) {
            console.error(`${name} error:`, e);
            err(socket, 'Internal server error');
        }
    });

    wrap('sos:trigger', handleSosTrigger);

    socket.on('admin:register', (data) => {
        handleAdminRegister(socket, data).catch((e) => console.error('admin:register error:', e));
    });
}

module.exports = { initSosSocket };
