module.exports = (sequelize, DataTypes) => {
    const TaxiOrderLog = sequelize.define('taxi_order_logs', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        order_id: { type: DataTypes.INTEGER },
        status: { type: DataTypes.TEXT },
        changed_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    TaxiOrderLog.associate = (db) => {
        TaxiOrderLog.belongsTo(db.TaxiOrder, { foreignKey: 'order_id', as: 'order' });
    };

    return TaxiOrderLog;
};
