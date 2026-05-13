require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
require('./config/firebase');
const axios = require('axios');

const app = express();

app.use(helmet());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// routes
const routes = {
    userRouter: require('./routes/userRouter'),
    cityRouter: require('./routes/constants/cityRouter'),
};

app.use('/api/users', routes.userRouter);
app.use('/api/cities', routes.cityRouter);



app.get('/api/ping', (req, res) => {
    return res.status(200).json({
        status: true,
        message: "Server running"
    });
});



// 3. Эндпоинт для получения пути (из Docker OSRM)
app.get('/api/route', async (req, res) => {
    const { start, end } = req.query; // формат: lng,lat
    try {
        const response = await axios.get(`http://216.250.11.232:5000/route/v1/driving/${start};${end}?overview=full&geometries=geojson`);
        res.json(response.data.routes[0]);
    } catch (err) {
        console.log('Erro marsrut: ', err);

        res.status(500).json({ error: "Маршрут не найден" });
    }
});


// Поиск места по названию (используем твою таблицу из PostGIS)
app.get('/search', async (req, res) => {
    const { name } = req.query;
    try {
        // ВНИМАНИЕ: Проверь название таблицы в своей базе (gis_osm_places_free_1 или похожая)
        const query = `
      SELECT name, ST_X(geom) as lng, ST_Y(geom) as lat 
      FROM gis_osm_places_free_1 
      WHERE name ILIKE $1 
      LIMIT 10
    `;
        const result = await pool.query(query, [`%${name}%`]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Ошибка поиска в базе данных" });
    }
});



const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
};

start();
