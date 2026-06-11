const { Pool } = require('pg');

const mapPool = new Pool({
    host:     process.env.MAP_DB_HOST,
    port:     process.env.MAP_DB_PORT || 5432,
    user:     process.env.MAP_DB_USER,
    password: process.env.MAP_DB_PASSWORD,
    database: process.env.MAP_DB_NAME,
});

module.exports = { mapPool };
