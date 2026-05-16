require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const pg = require('pg');
const axios = require('axios');
const { pool, connectDB } = require('./config/db');
require('./config/firebase');
const { sendOtpPush, encrypt } = require('./service/push.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// routes
const routes = {
    userRouter: require('./routes/userRouter'),
    cityRouter: require('./routes/constants/cityRouter'),
    addressRouter: require('./routes/addressRouter'),
    markaRouter: require('./routes/constants/markaRouter')
};

app.use('/api/users', routes.userRouter);
app.use('/api/cities', routes.cityRouter);
app.use('/api/addresses', routes.addressRouter);
app.use('/api/cars', routes.markaRouter);

// register FCM token for OTP delivery
app.post('/api/otp/device', async (req, res) => {
    try {
        const { phone, token } = req.body;
        if (!phone || !token) return res.status(400).json({ status: false, message: 'phone and token required' });

        await pool.query(
            `INSERT INTO device_tokens (phone, fcm_token)
             VALUES ($1, $2)
             ON CONFLICT (phone) DO UPDATE SET fcm_token = EXCLUDED.fcm_token, updated_at = NOW()`,
            [phone, token]
        );
        return res.status(200).json({ status: true });
    } catch (error) {
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
        const result = await pool.query(query, [`%${name}%`]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка поиска в базе данных' });
    }
});

// ─── Socket.IO ───────────────────────────────────────────────
const onlinePhones = new Set();

io.on('connection', (socket) => {
    socket.on('register', async ({ phone, token }) => {
        const existing = await io.in(phone).fetchSockets();
        for (const s of existing) {
            if (s.id !== socket.id) s.disconnect(true);
        }

        socket.phone = phone;
        socket.join(phone);
        onlinePhones.add(phone);

        if (token) {
            await pool.query(
                `INSERT INTO device_tokens (phone, fcm_token)
                 VALUES ($1, $2)
                 ON CONFLICT (phone) DO UPDATE SET fcm_token = EXCLUDED.fcm_token, updated_at = NOW()`,
                [phone, token]
            );
        }
        console.log(`📱 ${phone} connected`);
    });

    socket.on('disconnect', (reason) => {
        if (socket.phone) {
            onlinePhones.delete(socket.phone);
            console.log(`🔴 ${socket.phone} offline | ${reason}`);
        }
    });
});

// ─── OTP NOTIFY listener ─────────────────────────────────────
async function markOtpAsSended(id) {
    const result = await pool.query(
        `UPDATE otp_codes SET is_sended = TRUE WHERE id = $1 AND is_sended = FALSE RETURNING id`,
        [id]
    );
    return result.rowCount > 0;
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
            const { rows } = await pool.query('SELECT fcm_token FROM device_tokens');
            for (const row of rows) {
                const ok = await sendOtpPush(row.fcm_token, id, code, phone);
                if (ok) {
                    pushSent = true;
                    break;
                }
                await pool.query('DELETE FROM device_tokens WHERE fcm_token = $1', [row.fcm_token]);
            }
        }

        if (!pushSent) console.log('OTP was NOT sent');
    });
}

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();
    await startOtpListener();
    server.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
};

start();
