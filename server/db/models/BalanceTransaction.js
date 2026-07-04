module.exports = (sequelize, DataTypes) => {
    const BalanceTransaction = sequelize.define('balance_tranzaksion', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        sended_user_id: { type: DataTypes.INTEGER },
        confirmed_user_id: { type: DataTypes.INTEGER },
        sended_name: { type: DataTypes.TEXT },
        confirmed_name: { type: DataTypes.TEXT },
        price: { type: DataTypes.DECIMAL },
        is_added: { type: DataTypes.BOOLEAN },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    return BalanceTransaction;
};
