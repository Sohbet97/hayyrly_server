// Table + columns match PLAN.md §3.1 (app_data.pricing_config).
module.exports = (sequelize, DataTypes) => {
    const CityPricing = sequelize.define('pricing_config', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        city_id: { type: DataTypes.INTEGER, unique: true },
        base_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 10 },
        price_per_km: { type: DataTypes.DECIMAL(10, 2), defaultValue: 2.5 },
        free_wait_min: { type: DataTypes.DECIMAL(5, 2), defaultValue: 3 },
        wait_price_min: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.5 },
        commission_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 15 },
        updated_at: { type: DataTypes.DATE },
        updated_by: { type: DataTypes.INTEGER },
    }, {
        timestamps: false,
        tableName: 'pricing_config',
    });

    CityPricing.associate = (db) => {
        CityPricing.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' });
    };

    return CityPricing;
};
