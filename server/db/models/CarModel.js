module.exports = (sequelize, DataTypes) => {
    const CarModel = sequelize.define('models', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        marka_id: { type: DataTypes.INTEGER },
        name: { type: DataTypes.TEXT },
    }, {
        timestamps: false,
    });

    CarModel.associate = (db) => {
        CarModel.belongsTo(db.Marka, { foreignKey: 'marka_id', as: 'marka' });
    };

    return CarModel;
};
