const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            options: '-c search_path=app_data,public',
        },
    }
);

const db = { sequelize, Sequelize };

db.User = require('./models/User')(sequelize, DataTypes);
db.OtpCode = require('./models/OtpCode')(sequelize, DataTypes);
db.DeviceToken = require('./models/DeviceToken')(sequelize, DataTypes);
db.Taxi = require('./models/Taxi')(sequelize, DataTypes);
db.TaxiOrder = require('./models/TaxiOrder')(sequelize, DataTypes);
db.TaxiOrderLog = require('./models/TaxiOrderLog')(sequelize, DataTypes);
db.OrderMessage = require('./models/OrderMessage')(sequelize, DataTypes);
db.Balance = require('./models/Balance')(sequelize, DataTypes);
db.BalanceTransaction = require('./models/BalanceTransaction')(sequelize, DataTypes);
db.Payment = require('./models/Payment')(sequelize, DataTypes);
db.City = require('./models/City')(sequelize, DataTypes);
db.Marka = require('./models/Marka')(sequelize, DataTypes);
db.CarModel = require('./models/CarModel')(sequelize, DataTypes);
db.Service = require('./models/Service')(sequelize, DataTypes);
db.Address = require('./models/Address')(sequelize, DataTypes);

// Admin module models (web panel only)
db.AdminUser = require('../modules/admin/models/AdminUser')(sequelize, DataTypes);
db.CityPricing = require('../modules/admin/models/CityPricing')(sequelize, DataTypes);
db.DriverApplication = require('../modules/admin/models/DriverApplication')(sequelize, DataTypes);
db.BalanceRequest = require('../modules/admin/models/BalanceRequest')(sequelize, DataTypes);
db.BalanceRequestMessage = require('../modules/admin/models/BalanceRequestMessage')(sequelize, DataTypes);
db.AdminSettings = require('../modules/admin/models/AdminSettings')(sequelize, DataTypes);
db.AdminNotificationPref = require('../modules/admin/models/AdminNotificationPref')(sequelize, DataTypes);

Object.values(db).forEach((model) => {
    if (model && typeof model.associate === 'function') {
        model.associate(db);
    }
});

// Schema is managed externally (raw SQL migrations) — never sync().

async function connectSequelize() {
    try {
        await sequelize.authenticate();
        const [row] = await sequelize.query('SHOW search_path', { type: sequelize.QueryTypes.SELECT });
        console.log(`PostgreSQL connected. Search path: ${row.search_path}`);
    } catch (err) {
        console.error('PostgreSQL connection error:', err.message);
        process.exit(1);
    }
}

module.exports = { ...db, connectSequelize };
