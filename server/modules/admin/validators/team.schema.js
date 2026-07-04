const yup = require('yup');

const teamCreateSchema = yup.object({
    name: yup.string().required(),
    phone: yup.string().required(),
    password: yup.string().min(6).required(),
    role: yup.string().oneOf(['admin', 'operator']).default('operator'),
});

const teamUpdateSchema = yup.object({
    name: yup.string(),
    phone: yup.string(),
    password: yup.string().min(6),
    role: yup.string().oneOf(['admin', 'operator']),
    is_active: yup.boolean(),
});

module.exports = { teamCreateSchema, teamUpdateSchema };
