const yup = require('yup');

const settingsUpdateSchema = yup.object({
    company_name: yup.string().trim().min(1).required(),
    support_phone: yup.string().trim().min(1).required(),
    timezone: yup.string().trim().min(1).required(),
    default_lang: yup.string().oneOf(['tk', 'ru']).required(),
    default_currency: yup.string().oneOf(['TMT', 'USD']).required(),
    distance_unit: yup.string().oneOf(['km', 'mi']).required(),
    date_format: yup.string().oneOf(['DD.MM.YYYY', 'YYYY-MM-DD']).required(),
});

const notifRowSchema = yup.object({
    key: yup.string().required(),
    push: yup.boolean().required(),
    sms: yup.boolean().required(),
    email: yup.boolean().required(),
});

const notifPrefsUpdateSchema = yup.object({
    rows: yup.array().of(notifRowSchema).required(),
    quiet_hours_enabled: yup.boolean().required(),
    quiet_hours_start: yup.string().required(),
    quiet_hours_end: yup.string().required(),
});

module.exports = { settingsUpdateSchema, notifPrefsUpdateSchema };
