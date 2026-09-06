// Table + columns match the production app_data.balance_requests schema
// (created out-of-band, see migrations/011_balance_requests.sql).
module.exports = (sequelize, DataTypes) => {
    const BalanceRequest = sequelize.define('balance_requests', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        status: { type: DataTypes.ENUM('pending', 'confirmed', 'rejected'), allowNull: false, defaultValue: 'pending' },
        amount: { type: DataTypes.DECIMAL(10, 2) },
        operator_id: { type: DataTypes.INTEGER },
        reject_reason: { type: DataTypes.TEXT },
        created_at: { type: DataTypes.DATE },
        updated_at: { type: DataTypes.DATE },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    BalanceRequest.associate = (db) => {
        BalanceRequest.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
        BalanceRequest.hasMany(db.BalanceRequestMessage, { foreignKey: 'request_id', as: 'messages' });
    };

    return BalanceRequest;
};
