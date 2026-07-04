// Table + columns match PLAN.md §3.3 (app_data.driver_applications).
module.exports = (sequelize, DataTypes) => {
    const DriverApplication = sequelize.define('driver_applications', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        city_id: { type: DataTypes.INTEGER },
        first_name: { type: DataTypes.TEXT, allowNull: false },
        last_name: { type: DataTypes.TEXT, allowNull: false },
        phone: { type: DataTypes.TEXT, allowNull: false },
        birthday: { type: DataTypes.DATEONLY },
        auto_number: { type: DataTypes.TEXT },
        marka_id: { type: DataTypes.INTEGER },
        model_id: { type: DataTypes.INTEGER },
        auto_year: { type: DataTypes.INTEGER },
        license_photo: { type: DataTypes.TEXT },
        car_image: { type: DataTypes.TEXT },
        park: { type: DataTypes.TEXT },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'pending' },
        rejection_reason: { type: DataTypes.TEXT },
        reviewed_by: { type: DataTypes.INTEGER },
        reviewed_at: { type: DataTypes.DATE },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
    });

    DriverApplication.associate = (db) => {
        DriverApplication.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
        DriverApplication.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' });
        DriverApplication.belongsTo(db.Marka, { foreignKey: 'marka_id', as: 'marka' });
        DriverApplication.belongsTo(db.CarModel, { foreignKey: 'model_id', as: 'carModel' });
    };

    return DriverApplication;
};
