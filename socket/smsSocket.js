let _gatewaySocketId = null;

function initSmsSocket(io, socket) {
    socket.on('sms:register', () => {
        // если уже есть шлюз — убираем его из комнаты
        if (_gatewaySocketId && _gatewaySocketId !== socket.id) {
            io.sockets.sockets.get(_gatewaySocketId)?.leave('sms:gateway');
            console.log(`📵 SMS gateway replaced: ${_gatewaySocketId}`);
        }

        _gatewaySocketId = socket.id;
        socket.data.isSmsGateway = true;
        socket.join('sms:gateway');

        console.log(`📱 SMS gateway registered: ${socket.id}`);
        socket.emit('sms:registered');
    });

    socket.on('disconnect', () => {
        if (socket.data.isSmsGateway) {
            _gatewaySocketId = null;
            console.log('📵 SMS gateway disconnected');
        }
    });
}

module.exports = { initSmsSocket };
