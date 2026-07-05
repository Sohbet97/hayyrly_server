module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define('services', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name_tm: { type: DataTypes.TEXT },
        name_ru: { type: DataTypes.TEXT },
        name_en: { type: DataTypes.TEXT },
        emoji: { type: DataTypes.TEXT },
    }, {
        timestamps: false,
    });

    return Service;
};
