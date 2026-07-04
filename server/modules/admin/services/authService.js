const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AdminUser } = require('../../../db');
const ApiError = require('../../../exceptions/api-error');

class AuthService {
    static async login(phone, password) {
        const admin = await AdminUser.findOne({ where: { phone } });
        if (!admin || !admin.is_active) {
            throw ApiError.UnauthorizedError('Invalid credentials');
        }

        const matches = await bcrypt.compare(password, admin.password_hash);
        if (!matches) {
            throw ApiError.UnauthorizedError('Invalid credentials');
        }

        const token = jwt.sign(
            { id: admin.id, role: admin.role, typ: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        const plain = admin.get({ plain: true });
        delete plain.password_hash;

        return { token, user: plain };
    }
}

module.exports = AuthService;
