const yup = require('yup');

// cityId/autoNumber/markaId/modelId/autoYear/birthday map to NOT NULL columns on
// taxies — required (not nullable) on both create and update since the form
// always resends the full record.
const driverCreateSchema = yup.object({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    phone: yup.string().required(),
    birthday: yup.string().required(),
    cityId: yup.number().integer().required(),
    autoNumber: yup.string().required(),
    markaId: yup.number().integer().required(),
    modelId: yup.number().integer().required(),
    autoYear: yup.number().integer().required(),
    park: yup.boolean().nullable(),
    avatar: yup.string().nullable(),
    autoImage: yup.string().nullable(),
});

const driverUpdateSchema = yup.object({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    phone: yup.string().required(),
    birthday: yup.string().required(),
    cityId: yup.number().integer().required(),
    autoNumber: yup.string().required(),
    markaId: yup.number().integer().required(),
    modelId: yup.number().integer().required(),
    autoYear: yup.number().integer().required(),
    park: yup.boolean().nullable(),
    avatar: yup.string().nullable(),
    autoImage: yup.string().nullable(),
});

module.exports = { driverCreateSchema, driverUpdateSchema };
