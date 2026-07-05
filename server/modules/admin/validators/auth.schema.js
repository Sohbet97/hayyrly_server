const yup = require('yup');

const loginSchema = yup.object({
    phone: yup.string().required(),
    password: yup.string().required(),
});

module.exports = { loginSchema };
