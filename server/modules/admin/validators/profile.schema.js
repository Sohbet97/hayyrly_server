const yup = require('yup');

const updateProfileSchema = yup.object({
    name: yup.string(),
    phone: yup.string(),
    newPassword: yup.string().min(6),
    currentPassword: yup.string().when('newPassword', {
        is: (val) => !!val,
        then: (schema) => schema.required('Current password is required to set a new password'),
    }),
});

module.exports = { updateProfileSchema };
