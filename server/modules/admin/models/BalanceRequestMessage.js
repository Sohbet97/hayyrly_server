// Table + columns match the production app_data.balance_request_messages schema
// (created out-of-band, see migrations/011_balance_requests.sql).
module.exports = (sequelize, DataTypes) => {
    const BalanceRequestMessage = sequelize.define('balance_request_messages', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        request_id: { type: DataTypes.BIGINT, allowNull: false },
        sender_type: { type: DataTypes.ENUM('user', 'taxi', 'admin'), allowNull: false },
        sender_id: { type: DataTypes.INTEGER, allowNull: false },
        message: { type: DataTypes.TEXT },
        photo_url: { type: DataTypes.TEXT },
        is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    BalanceRequestMessage.associate = (db) => {
        BalanceRequestMessage.belongsTo(db.BalanceRequest, { foreignKey: 'request_id', as: 'request' });
    };

    return BalanceRequestMessage;
};
