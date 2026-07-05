module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('payments', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        order_id: { type: DataTypes.INTEGER },
        user_id: { type: DataTypes.INTEGER },
        taxi_id: { type: DataTypes.INTEGER },
        amount: { type: DataTypes.DECIMAL },
        payment_type: { type: DataTypes.TEXT },
        status: { type: DataTypes.TEXT },
        refund_note: { type: DataTypes.TEXT },
        refunded_at: { type: DataTypes.DATE },
        refunded_by: { type: DataTypes.INTEGER },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    Payment.associate = (db) => {
        Payment.belongsTo(db.TaxiOrder, { foreignKey: 'order_id', as: 'order' });
        Payment.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
        Payment.belongsTo(db.Taxi, { foreignKey: 'taxi_id', as: 'taxi' });
    };

    return Payment;
};
