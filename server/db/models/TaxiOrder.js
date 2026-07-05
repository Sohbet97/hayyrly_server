// NOTE: start_location / end_location (geography) are intentionally NOT declared here.
// Declaring a GEOGRAPHY/GEOMETRY attribute on any Sequelize model registers a global
// pg type parser that rewrites WKB into GeoJSON for every query on the connection,
// which would silently change the raw `RETURNING *` payloads used elsewhere
// (orderModel.js). All geo-touching reads/writes on this table stay raw SQL.
module.exports = (sequelize, DataTypes) => {
    const TaxiOrder = sequelize.define('taxi_orders', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER },
        taxi_id: { type: DataTypes.INTEGER },
        start_address: { type: DataTypes.TEXT },
        end_address: { type: DataTypes.TEXT },
        distance_km: { type: DataTypes.DECIMAL },
        payment_type: { type: DataTypes.TEXT },
        base_price: { type: DataTypes.DECIMAL },
        waiting_price: { type: DataTypes.DECIMAL },
        total_price: { type: DataTypes.DECIMAL },
        status: { type: DataTypes.TEXT },
        created_at: { type: DataTypes.DATE },
        updated_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    TaxiOrder.associate = (db) => {
        TaxiOrder.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
        TaxiOrder.belongsTo(db.Taxi, { foreignKey: 'taxi_id', as: 'taxi' });
        TaxiOrder.hasMany(db.TaxiOrderLog, { foreignKey: 'order_id', as: 'logs' });
    };

    return TaxiOrder;
};
