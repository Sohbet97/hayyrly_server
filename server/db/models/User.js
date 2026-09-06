module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('users', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        phone: { type: DataTypes.TEXT, unique: true },
        full_name: { type: DataTypes.TEXT },
        avatar: { type: DataTypes.TEXT },
        // Added by migrations/012_users_city.sql — requires that migration to be applied first.
        city_id: { type: DataTypes.INTEGER },
        // Added by migrations/003_users_role.sql — requires that migration to be applied first.
        role: { type: DataTypes.TEXT, defaultValue: 'client' },
        // Added by migrations/007_users_block.sql — requires that migration to be applied first.
        is_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
        blocked_reason: { type: DataTypes.TEXT },
        blocked_at: { type: DataTypes.DATE },
        created_at: { type: DataTypes.DATE },
        updated_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    User.associate = (db) => {
        User.hasOne(db.Balance, { foreignKey: 'user_id', as: 'balanceRow' });
        User.hasOne(db.Taxi, { foreignKey: 'user_id', as: 'taxi' });
        User.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' });
    };

    return User;
};
