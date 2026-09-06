module.exports = (sequelize, DataTypes) => {
    const OrderMessage = sequelize.define('order_messages', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        order_id: { type: DataTypes.INTEGER },
        sender_type: { type: DataTypes.STRING },
        sender_id: { type: DataTypes.INTEGER },
        body: { type: DataTypes.TEXT },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    OrderMessage.associate = (db) => {
        OrderMessage.belongsTo(db.TaxiOrder, { foreignKey: 'order_id', as: 'order' });
    };

    return OrderMessage;
};
