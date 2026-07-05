const AuthService = require('../services/authService');
const Validator = require('../../../utils/validator');
const { loginSchema } = require('../validators/auth.schema');
const { updateProfileSchema } = require('../validators/profile.schema');
const ApiError = require('../../../exceptions/api-error');

class AuthController {
    static async login(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(loginSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const { phone, password } = req.body;
            const { token, user } = await AuthService.login(phone, password);

            return res.status(200).json({ status: true, token, user });
        } catch (e) { next(e); }
    }

    static async me(req, res, next) {
        try {
            return res.status(200).json({ status: true, user: req.admin });
        } catch (e) { next(e); }
    }

    static async updateMe(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(updateProfileSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const user = await AuthService.updateProfile(req.admin.id, req.body);
            return res.status(200).json({ status: true, user });
        } catch (e) { next(e); }
    }
}

module.exports = AuthController;
