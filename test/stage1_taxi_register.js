const { io } = require('socket.io-client');

const PORT = process.env.PORT || 8000;
const socket = io(`http://localhost:${PORT}`, { transports: ['websocket'] });

socket.on('connect', () => {
    console.log('✅ Connected, socket id:', socket.id);

    socket.emit('taxi:register', { taxiId: 1, cityId: 5 });
    console.log('📤 Sent taxi:register { taxiId: 1, cityId: 5 }');
});

socket.on('taxi:registered', (data) => {
    console.log('✅ taxi:registered received:', data);
    socket.disconnect();
    process.exit(0);
});

socket.on('taxi:error', (data) => {
    console.error('❌ taxi:error:', data);
    socket.disconnect();
    process.exit(1);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('❌ Timeout — no response in 5s');
    process.exit(1);
}, 5000);
