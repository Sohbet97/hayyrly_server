const yup = require('yup');

const createCitySchema = yup.object({
    name_tm: yup.string().trim().required(),
    name_ru: yup.string().trim().required(),
    name_en: yup.string().trim().required(),
});

module.exports = { createCitySchema };
