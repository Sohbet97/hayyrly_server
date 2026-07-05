class Validator {
    static async validate(schema, form) {
        try {
            await schema.validate(form, { abortEarly: false });
            return { isError: false, errors: null };
        } catch (err) {
            const errors = {};
            for (const inner of err.inner ?? []) {
                if (inner.path) errors[inner.path] = inner.message;
            }
            return { isError: true, errors };
        }
    }
}

module.exports = Validator;
