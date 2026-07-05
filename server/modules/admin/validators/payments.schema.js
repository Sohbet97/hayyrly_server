const yup = require('yup');

const refundSchema = yup.object({
    note: yup.string().trim().nullable(),
});

module.exports = { refundSchema };
