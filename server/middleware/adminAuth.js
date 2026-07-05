const jwt = require('jsonwebtoken');
const ApiError = require('../exceptions/api-error');
const { AdminUser } = require('../db');

module.exports = async function adminAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw ApiError.UnauthorizedError();
        }

        const token = header.slice('Bearer '.length);

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            throw ApiError.UnauthorizedError();
        }

        // `typ: 'admin'` distinguishes admin-issued tokens from mobile-user tokens
        // (both signed with the same JWT_SECRET) so a mobile token can never pass here.
        if (payload.typ !== 'admin') {
            throw ApiError.UnauthorizedError();
        }

        const admin = await AdminUser.findByPk(payload.id);
        if (!admin || !admin.is_active) {
            throw ApiError.UnauthorizedError();
        }

        req.admin = admin.get({ plain: true });
        delete req.admin.password_hash;

        next();
    } catch (err) {
        next(err);
    }
};
