const yup = require('yup');

const setBlockedSchema = yup.object({
    isBlocked: yup.boolean().required(),
    reason: yup.string().trim().max(500).nullable(),
});

module.exports = { setBlockedSchema };
