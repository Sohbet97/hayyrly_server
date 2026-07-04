module.exports = (sequelize, DataTypes) => {
    const Balance = sequelize.define('balance', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, unique: true },
        price: { type: DataTypes.DECIMAL },
    }, {
        timestamps: false,
    });

    Balance.associate = (db) => {
        Balance.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
    };

    return Balance;
};
