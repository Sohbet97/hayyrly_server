module.exports = (sequelize, DataTypes) => {
    const DeviceToken = sequelize.define('device_tokens', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        phone: { type: DataTypes.TEXT, unique: true },
        fcm_token: { type: DataTypes.TEXT },
        updated_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    return DeviceToken;
};
