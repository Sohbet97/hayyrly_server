module.exports = (sequelize, DataTypes) => {
    const Taxi = sequelize.define('taxies', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        first_name: { type: DataTypes.TEXT },
        last_name: { type: DataTypes.TEXT },
        phone: { type: DataTypes.TEXT },
        birthday: { type: DataTypes.DATEONLY },
        user_id: { type: DataTypes.INTEGER },
        city_id: { type: DataTypes.INTEGER },
        avatar: { type: DataTypes.TEXT },
        auto_number: { type: DataTypes.TEXT },
        marka_id: { type: DataTypes.INTEGER },
        model_id: { type: DataTypes.INTEGER },
        auto_year: { type: DataTypes.INTEGER },
        auto_image: { type: DataTypes.TEXT },
        // Real column is smallint (0/1), not boolean — coerce any boolean assignment
        // (`taxi.is_active = true`, `Taxi.create({ is_active: true })`) to 0/1 so it
        // doesn't hit "operator does not exist: smallint = boolean" on save.
        is_active: {
            type: DataTypes.SMALLINT,
            defaultValue: 0,
            set(value) {
                this.setDataValue('is_active', value ? 1 : 0);
            },
        },
        park: { type: DataTypes.TEXT },
    }, {
        timestamps: false,
    });

    Taxi.associate = (db) => {
        Taxi.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
        Taxi.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' });
        Taxi.belongsTo(db.Marka, { foreignKey: 'marka_id', as: 'marka' });
        Taxi.belongsTo(db.CarModel, { foreignKey: 'model_id', as: 'carModel' });
    };

    return Taxi;
};
