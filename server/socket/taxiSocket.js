const redisClient      = require('../service/redisClient');
const { sequelize }    = require('../db');

const FLUSH_INTERVAL_MS = 10_000; // писать в PG раз в 10 секунд

// taxiId → { timer, lat, lng }
const locationDebounce = new Map();

async function upsertLocation(taxiId, lat, lng) {
    await sequelize.query(
        `INSERT INTO app_data.taxies_locations (taxi_id, location)
         VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography)
         ON CONFLICT (taxi_id) DO UPDATE SET location = EXCLUDED.location`,
        { bind: [taxiId, lng, lat] }  // ST_MakePoint(lng, lat) — PostGIS порядок
    );
    console.log(`💾 Taxi ${taxiId} location saved to PG`);
}

// вызывается при disconnect — сбрасываем таймер и пишем сразу
async function flushAndClearDebounce(taxiId) {
    const entry = locationDebounce.get(taxiId);
    if (!entry) return;
    clearTimeout(entry.timer);
    locationDebounce.delete(taxiId);
    await upsertLocation(taxiId, entry.lat, entry.lng);
}

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
    socket.join(`taxis:city:${cityId}`); // order:new broadcasts go here

    await redisClient.sAdd(`taxis:city:${cityId}`, `taxi_${taxiId}`);
    await redisClient.hSet(`taxi:${taxiId}:meta`, {
        cityId:    String(cityId),
        status:    'free',
    });

    console.log(`🚕 Taxi ${taxiId} registered | city ${cityId}`);
    socket.emit('taxi:registered', { taxiId, cityId });
}

async function handleTaxiLocation(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const cityId = socket.data.cityId;

    if (!taxiId) {
        socket.emit('taxi:error', { message: 'Not registered. Send taxi:register first' });
        return;
    }

    const { lat, lng } = data;

    if (lat == null || lng == null) {
        socket.emit('taxi:error', { message: 'lat and lng are required' });
        return;
    }

    await redisClient.hSet(`taxi:${taxiId}:meta`, {
        lat:       String(lat),
        lng:       String(lng),
        updatedAt: String(Date.now()),
    });

    const meta = await redisClient.hGetAll(`taxi:${taxiId}:meta`);

    const payload = { taxiId, lat, lng, status: meta.status ?? 'free' };

    // конкретные наблюдатели этого такси
    io.to(`watch:taxi:${taxiId}`).emit('taxi:location:update', payload);
    // наблюдатели всего города
    io.to(`watch:city:${cityId}`).emit('taxi:location:update', payload);

    // debounce: сбрасываем таймер, запомним последние координаты
    const existing = locationDebounce.get(taxiId);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
        locationDebounce.delete(taxiId);
        upsertLocation(taxiId, lat, lng).catch((err) =>
            console.error(`PG upsert error taxi ${taxiId}:`, err)
        );
    }, FLUSH_INTERVAL_MS);

    locationDebounce.set(taxiId, { timer, lat, lng });

    console.log(`📍 Taxi ${taxiId} location updated | ${lat}, ${lng}`);
}

async function handleTaxiStatus(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const cityId = socket.data.cityId;

    if (!taxiId) {
        socket.emit('taxi:error', { message: 'Not registered. Send taxi:register first' });
        return;
    }

    const { status } = data;

    if (status !== 'free' && status !== 'busy') {
        socket.emit('taxi:error', { message: 'status must be "free" or "busy"' });
        return;
    }

    await redisClient.hSet(`taxi:${taxiId}:meta`, { status });

    const payload = { taxiId, status };

    io.to(`watch:taxi:${taxiId}`).emit('taxi:status:update', payload);
    io.to(`watch:city:${cityId}`).emit('taxi:status:update', payload);

    console.log(`🔄 Taxi ${taxiId} status → ${status}`);
    socket.emit('taxi:status:updated', payload);
}

// вернуть все такси города с их текущим состоянием из Redis
async function handleGetTaxis(socket, data) {
    const { cityId } = data;

    if (!cityId) {
        socket.emit('taxi:error', { message: 'cityId is required' });
        return;
    }

    const members = await redisClient.sMembers(`taxis:city:${cityId}`);

    const taxis = await Promise.all(
        members.map(async (member) => {
            const taxiId = member.replace('taxi_', '');
            const meta   = await redisClient.hGetAll(`taxi:${taxiId}:meta`);
            return {
                taxiId,
                lat:    meta.lat    ? parseFloat(meta.lat)    : null,
                lng:    meta.lng    ? parseFloat(meta.lng)    : null,
                status: meta.status ?? 'free',
            };
        })
    );

    socket.emit('city:taxis', { cityId, taxis });
}

function handleClientWatch(socket, data) {
    const { taxiId } = data;

    if (!taxiId) {
        socket.emit('taxi:error', { message: 'taxiId is required' });
        return;
    }

    socket.join(`watch:taxi:${taxiId}`);
    console.log(`👁 Client ${socket.id} watching taxi ${taxiId}`);
}

function handleClientUnwatch(socket, data) {
    const { taxiId } = data;
    if (!taxiId) return;

    socket.leave(`watch:taxi:${taxiId}`);
    console.log(`🚫 Client ${socket.id} stopped watching taxi ${taxiId}`);
}

function handleClientWatchCity(socket, data) {
    const { cityId } = data;

    if (!cityId) {
        socket.emit('taxi:error', { message: 'cityId is required' });
        return;
    }

    socket.join(`watch:city:${cityId}`);
    console.log(`🌆 Client ${socket.id} watching city ${cityId}`);
}

function handleClientUnwatchCity(socket, data) {
    const { cityId } = data;
    if (!cityId) return;

    socket.leave(`watch:city:${cityId}`);
    console.log(`🚫 Client ${socket.id} stopped watching city ${cityId}`);
}

function initTaxiSocket(io, socket) {
    socket.on('taxi:register', async (data) => {
        try { await handleTaxiRegister(socket, data); }
        catch (err) {
            console.error('Error taxi:register:', err);
            socket.emit('taxi:error', { message: 'Internal server error' });
        }
    });

    socket.on('taxi:location', async (data) => {
        try { await handleTaxiLocation(io, socket, data); }
        catch (err) {
            console.error('Error taxi:location:', err);
            socket.emit('taxi:error', { message: 'Internal server error' });
        }
    });

    socket.on('taxi:status', async (data) => {
        try { await handleTaxiStatus(io, socket, data); }
        catch (err) {
            console.error('Error taxi:status:', err);
            socket.emit('taxi:error', { message: 'Internal server error' });
        }
    });

    socket.on('client:watch',         (data) => handleClientWatch(socket, data));
    socket.on('client:unwatch',       (data) => handleClientUnwatch(socket, data));
    socket.on('client:watch:city',    (data) => handleClientWatchCity(socket, data));
    socket.on('client:unwatch:city',  (data) => handleClientUnwatchCity(socket, data));
    socket.on('client:get:taxis',     async (data) => {
        try { await handleGetTaxis(socket, data); }
        catch (err) {
            console.error('Error client:get:taxis:', err);
            socket.emit('taxi:error', { message: 'Internal server error' });
        }
    });
}

module.exports = { initTaxiSocket, flushAndClearDebounce };
