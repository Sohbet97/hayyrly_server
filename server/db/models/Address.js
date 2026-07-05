module.exports = (sequelize, DataTypes) => {
    const Address = sequelize.define('address', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER },
        city_id: { type: DataTypes.INTEGER },
        address: { type: DataTypes.TEXT },
        latitude: { type: DataTypes.DECIMAL },
        longitude: { type: DataTypes.DECIMAL },
    }, {
        timestamps: false,
        tableName: 'address',
    });

    Address.associate = (db) => {
        Address.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
        Address.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' });
    };

    return Address;
};
