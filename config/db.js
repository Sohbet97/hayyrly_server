const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Установка search_path через options - это лучший выбор
  options: '-c search_path=app_data,public'
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    // Проверочный запрос, чтобы убедиться, что search_path работает
    const res = await client.query('SHOW search_path');
    console.log(`PostgreSQL connected. Search path: ${res.rows[0].search_path}`);
    client.release();
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message);
    process.exit(1); // Останавливаем приложение, если нет связи с БД
  }
};

module.exports = { pool, connectDB };