const redisClient = require('../service/redisClient');

async function handleTaxiRegister(socket, data) {
    const { taxiId, cityId } = data;

    if (!taxiId || !cityId) {
        socket.emit('taxi:error', { message: 'taxiId and cityId are required' });
        return;
    }

    socket.data.taxiId = taxiId;
    socket.data.cityId = cityId;
    socket.data.role   = 'taxi';

    socket.join(`taxi:${taxiId}`);

    await redisClient.sAdd(`taxis:city:${cityId}`, `taxi_${taxiId}`);
    await redisClient.hSet(`taxi:${taxiId}:meta`, {
        cityId:    String(cityId),
        status:    'active',
    });

    console.log(`🚕 Taxi ${taxiId} registered | city ${cityId}`);
    socket.emit('taxi:registered', { taxiId, cityId });
}

function initTaxiSocket(socket) {
    socket.on('taxi:register', async (data) => {
        try {
            await handleTaxiRegister(socket, data);
        } catch (err) {
            console.error('Error taxi:register:', err);
            socket.emit('taxi:error', { message: 'Internal server error' });
        }
    });
}

module.exports = { initTaxiSocket };
