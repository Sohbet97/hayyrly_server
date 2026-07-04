module.exports = (sequelize, DataTypes) => {
    const OtpCode = sequelize.define('otp_codes', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        phone: { type: DataTypes.TEXT, unique: true },
        code: { type: DataTypes.TEXT },
        is_used: { type: DataTypes.BOOLEAN },
        is_sended: { type: DataTypes.BOOLEAN },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    return OtpCode;
};
