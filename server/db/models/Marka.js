module.exports = (sequelize, DataTypes) => {
    const Marka = sequelize.define('markas', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.TEXT },
        image_url: { type: DataTypes.TEXT },
    }, {
        timestamps: false,
    });

    Marka.associate = (db) => {
        Marka.hasMany(db.CarModel, { foreignKey: 'marka_id', as: 'models' });
    };

    return Marka;
};
