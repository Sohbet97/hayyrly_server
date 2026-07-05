const yup = require('yup');

const applicationSubmitSchema = yup.object({
    userId: yup.number().integer().required(),
    cityId: yup.number().integer().nullable(),
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    phone: yup.string().required(),
    birthday: yup.string().nullable(),
    autoNumber: yup.string().nullable(),
    markaId: yup.number().integer().nullable(),
    modelId: yup.number().integer().nullable(),
    autoYear: yup.number().integer().nullable(),
    licensePhoto: yup.string().nullable(),
    carImage: yup.string().nullable(),
    park: yup.string().nullable(),
});

const applicationRejectSchema = yup.object({
    reason: yup.string().required(),
});

module.exports = { applicationSubmitSchema, applicationRejectSchema };
