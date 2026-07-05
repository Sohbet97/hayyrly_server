// Table + columns match migrations/005_admin_settings.sql — one row per admin_users.id.
module.exports = (sequelize, DataTypes) => {
    const AdminNotificationPref = sequelize.define('admin_notification_prefs', {
        admin_id: { type: DataTypes.INTEGER, primaryKey: true },
        rows: { type: DataTypes.JSONB },
        quiet_hours_enabled: { type: DataTypes.BOOLEAN },
        quiet_hours_start: { type: DataTypes.TIME },
        quiet_hours_end: { type: DataTypes.TIME },
        updated_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    return AdminNotificationPref;
};
