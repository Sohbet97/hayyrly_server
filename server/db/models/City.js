module.exports = (sequelize, DataTypes) => {
    const City = sequelize.define('cities', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name_tm: { type: DataTypes.TEXT },
        name_ru: { type: DataTypes.TEXT },
        name_en: { type: DataTypes.TEXT },
        parent_id: { type: DataTypes.INTEGER },
    }, {
        timestamps: false,
    });

    City.associate = (db) => {
        City.hasMany(db.City, { foreignKey: 'parent_id', as: 'children' });
        City.belongsTo(db.City, { foreignKey: 'parent_id', as: 'parent' });
        City.hasOne(db.CityPricing, { foreignKey: 'city_id', as: 'pricing' });
    };

    return City;
};
