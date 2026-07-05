require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const pg = require('pg');
const axios = require('axios');
const { sequelize, connectSequelize } = require('./db');
require('./config/firebase');
const { sendOtpPush, encrypt } = require('./service/push.service');

const redisClient = require('./service/redisClient');
const { initTaxiSocket, flushAndClearDebounce } = require('./socket/taxiSocket');
const { initOrderSocket } = require('./socket/orderSocket');
const { initSmsSocket }   = require('./socket/smsSocket');
const smsService          = require('./service/smsService');
const swaggerUi           = require('swagger-ui-express');
const openapiSpec         = require('./docs/openapi');
const logger              = require('./utils/logger');
const requestLogger       = require('./middleware/requestLogger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(express.json());
app.use(requestLogger);
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Swagger/OpenAPI docs — helmet's default CSP blocks swagger-ui's inline
// script/style tags, so it's dropped just for this path.
app.use('/api/docs', (req, res, next) => { res.removeHeader('Content-Security-Policy'); next(); },
    swaggerUi.serve, swaggerUi.setup(openapiSpec));

// routes
const routes = {
    userRouter: require('./routes/userRouter'),
    cityRouter: require('./routes/constants/cityRouter'),
    addressRouter: require('./routes/addressRouter'),
    markaRouter: require('./routes/constants/markaRouter'),
    serviceRouter: require('./routes/constants/serviceRouter'),
    taksiRouter: require('./routes/Taksi/taksiRouter'),
    balanceRouter: require('./routes/balanceRouter'),
    orderRouter: require('./routes/order/orderRouter'),
    mapRouter:   require('./routes/mapRouter'),
    adminRouter: require('./modules/admin/routes'),
    publicPricingRouter: require('./modules/admin/routes/publicPricingRouter'),
    publicApplicationRouter: require('./modules/admin/routes/publicApplicationRouter'),
};

app.use('/api/users', routes.userRouter);
app.use('/api/cities', routes.cityRouter);
app.use('/api/addresses', routes.addressRouter);
app.use('/api/cars', routes.markaRouter);
app.use('/api/taksi', routes.taksiRouter);
app.use('/api/services', routes.serviceRouter);
app.use('/api/balance', routes.balanceRouter);
app.use('/api/orders', routes.orderRouter);
app.use('/api/map', routes.mapRouter);
app.use('/api/admin', routes.adminRouter);
app.use('/api/pricing', routes.publicPricingRouter);
app.use('/api/driver-applications', routes.publicApplicationRouter);

// register FCM token for OTP delivery
app.post('/api/otp/device', async (req, res) => {
    try {
        const { phone, token } = req.body;
        if (!phone || !token) return res.status(400).json({ status: false, message: 'phone and token required' });

        await sequelize.query(
            `INSERT INTO device_tokens (phone, fcm_token)
             VALUES ($1, $2)
             ON CONFLICT (phone) DO UPDATE SET fcm_token = EXCLUDED.fcm_token, updated_at = NOW()`,
            { bind: [phone, token] }
        );
        return res.status(200).json({ status: true });
    } catch (error) {
        logger.error('POST /api/otp/device failed', { error: error.message, stack: error.stack });
        return res.status(500).json({ status: false, message: error.message });
    }
});

app.get('/api/ping', (req, res) => {
    return res.status(200).json({ status: true, message: 'Server running' });
});

app.get('/api/route', async (req, res) => {
    const { start, end } = req.query;
    try {
        const response = await axios.get(
            `http://216.250.11.232:5000/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );
        res.json(response.data.routes[0]);
    } catch (err) {
        logger.error('GET /api/route failed', { error: err.message, stack: err.stack });
        res.status(500).json({ error: 'Маршрут не найден' });
    }
});


app.get('/search', async (req, res) => {
    const { name } = req.query;
    try {
        const query = `
            SELECT name, ST_X(geom) as lng, ST_Y(geom) as lat
            FROM gis_osm_places_free_1
            WHERE name ILIKE $1
            LIMIT 10
        `;
        const rows = await sequelize.query(query, { bind: [`%${name}%`], type: sequelize.QueryTypes.SELECT });
        res.json(rows);
    } catch (err) {
        logger.error('GET /search failed', { error: err.message, stack: err.stack });
        res.status(500).json({ error: 'Ошибка поиска в базе данных' });
    }
});

// ─── Socket.IO ───────────────────────────────────────────────
const onlinePhones = new Set();
smsService.init(io);

io.on('connection', (socket) => {
    initTaxiSocket(io, socket);
    initOrderSocket(io, socket);
    initSmsSocket(io, socket);

    socket.on('register', async ({ phone, token }) => {
        const existing = await io.in(phone).fetchSockets();
        for (const s of existing) {
            if (s.id !== socket.id) s.disconnect(true);
        }

        socket.phone = phone;
        socket.join(phone);
        onlinePhones.add(phone);

        if (token) {
            await sequelize.query(
                `INSERT INTO device_tokens (phone, fcm_token)
                 VALUES ($1, $2)
                 ON CONFLICT (phone) DO UPDATE SET fcm_token = EXCLUDED.fcm_token, updated_at = NOW()`,
                { bind: [phone, token] }
            );
        }
        console.log(`📱 ${phone} connected`);
    });

    socket.on('disconnect', async (reason) => {
        if (socket.phone) {
            onlinePhones.delete(socket.phone);
            console.log(`🔴 ${socket.phone} offline | ${reason}`);
        }

        if (socket.data?.taxiId && socket.data?.cityId) {
            const { taxiId, cityId } = socket.data;
            await redisClient.hSet(`taxi:${taxiId}:meta`, { status: 'offline' });
            await redisClient.sRem(`taxis:city:${cityId}`, `taxi_${taxiId}`);
            io.to(`watch:city:${cityId}`).emit('taxi:status:update', { taxiId, status: 'offline' });
            await flushAndClearDebounce(taxiId); // сохранить последнюю позицию в PG
            console.log(`🚕 Taxi ${taxiId} went offline`);
        }
    });
});

// ─── OTP NOTIFY listener ─────────────────────────────────────
async function markOtpAsSended(id) {
    const rows = await sequelize.query(
        `UPDATE otp_codes SET is_sended = TRUE WHERE id = $1 AND is_sended = FALSE RETURNING id`,
        { bind: [id], type: sequelize.QueryTypes.SELECT }
    );
    return rows.length > 0;
}

async function startOtpListener() {
    const client = new pg.Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        options: '-c search_path=app_data,public',
    });

    await client.connect();
    await client.query('LISTEN otp_channel');
    console.log('👂 Listening otp_channel...');

    client.on('notification', async (msg) => {
        const { id, phone, code } = JSON.parse(msg.payload);

        const claimed = await markOtpAsSended(id);
        if (!claimed) return;

        console.log('New OTP:', code, 'for', phone);

        let pushSent = false;

        if (onlinePhones.size > 0) {
            const phones = Array.from(onlinePhones);
            const randomPhone = phones[Math.floor(Math.random() * phones.length)];
            const encrypted = encrypt(String(code));
            io.to(randomPhone).emit('otp', {
                iv: encrypted.iv,
                data: encrypted.data,
                tag: encrypted.tag,
                otp_id: String(id),
                phone: String(phone),
            });
            pushSent = true;
            console.log('📡 OTP via socket to', randomPhone);
        } else {
            const rows = await sequelize.query('SELECT fcm_token FROM device_tokens', { type: sequelize.QueryTypes.SELECT });
            for (const row of rows) {
                const ok = await sendOtpPush(row.fcm_token, id, code, phone);
                if (ok) {
                    pushSent = true;
                    break;
                }
                await sequelize.query('DELETE FROM device_tokens WHERE fcm_token = $1', { bind: [row.fcm_token] });
            }
        }

        if (!pushSent) console.log('OTP was NOT sent');
    });
}

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        await redisClient.connect();
        logger.info('Redis Cache started');
    } catch (err) {
        logger.warn('Redis not available', { error: err.message });
    }

    await connectSequelize();
    await startOtpListener();
    server.listen(PORT, () => logger.info(`Server started on port ${PORT}`));
};

start();
