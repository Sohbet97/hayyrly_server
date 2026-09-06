const SupportModel = require('../models/Support/supportModel');

function err(socket, message) {
    socket.emit('support:error', { message });
}

// User sends a message to the admin support thread → persist + broadcast.
async function handleSupportSend(io, socket, data) {
    const { userId, message, photoUrl } = data;

    if (!userId || (!message && !photoUrl)) {
        return err(socket, 'userId and (message or photoUrl) are required');
    }

    const row = await SupportModel.addMessage({
        userId, senderType: 'user', senderId: userId, message: message ?? null, photoUrl: photoUrl ?? null,
    });

    io.to(`support:user:${userId}`).emit('support:message', row);
    io.to('admin:support').emit('support:message', row);
}

// User joins their own support thread room to receive admin replies live.
function handleSupportWatch(socket, data) {
    const { userId } = data;
    if (!userId) return;
    socket.join(`support:user:${userId}`);
}

function initSupportSocket(io, socket) {
    const wrap = (name, fn) => socket.on(name, async (data) => {
        try { await fn(io, socket, data); }
        catch (e) {
            console.error(`${name} error:`, e);
            err(socket, 'Internal server error');
        }
    });

    wrap('support:send', handleSupportSend);
    socket.on('support:watch', (data) => handleSupportWatch(socket, data));
}

module.exports = { initSupportSocket };
