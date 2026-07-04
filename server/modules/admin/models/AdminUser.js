module.exports = (sequelize, DataTypes) => {
    const AdminUser = sequelize.define('admin_users', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.TEXT, allowNull: false },
        phone: { type: DataTypes.TEXT, allowNull: false, unique: true },
        password_hash: { type: DataTypes.TEXT, allowNull: false },
        role: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'operator' },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at: { type: DataTypes.DATE },
        updated_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    return AdminUser;
};
