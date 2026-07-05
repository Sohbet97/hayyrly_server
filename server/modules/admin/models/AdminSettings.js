// Table + columns match migrations/005_admin_settings.sql — singleton row (id=1).
module.exports = (sequelize, DataTypes) => {
    const AdminSettings = sequelize.define('admin_settings', {
        id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
        company_name: { type: DataTypes.TEXT },
        support_phone: { type: DataTypes.TEXT },
        timezone: { type: DataTypes.TEXT },
        default_lang: { type: DataTypes.TEXT },
        default_currency: { type: DataTypes.TEXT },
        distance_unit: { type: DataTypes.TEXT },
        date_format: { type: DataTypes.TEXT },
        updated_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    return AdminSettings;
};
