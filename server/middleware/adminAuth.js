const jwt = require('jsonwebtoken');
const ApiError = require('../exceptions/api-error');
const { AdminUser } = require('../db');

// Shared by the Express middleware below and the Socket.IO admin handshake
// (server/socket/sosSocket.js) — both need to turn a raw Bearer token into
// a verified admin row using the same rules.
async function verifyAdminToken(token) {
    if (!token) return null;

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }

    // `typ: 'admin'` distinguishes admin-issued tokens from mobile-user tokens
    // (both signed with the same JWT_SECRET) so a mobile token can never pass here.
    if (payload.typ !== 'admin') return null;

    const admin = await AdminUser.findByPk(payload.id);
    if (!admin || !admin.is_active) return null;

    const plain = admin.get({ plain: true });
    delete plain.password_hash;
    return plain;
}

async function adminAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw ApiError.UnauthorizedError();
        }

        const admin = await verifyAdminToken(header.slice('Bearer '.length));
        if (!admin) throw ApiError.UnauthorizedError();

        req.admin = admin;

        next();
    } catch (err) {
        next(err);
    }
}

module.exports = adminAuth;
module.exports.verifyAdminToken = verifyAdminToken;
