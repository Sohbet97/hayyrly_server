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

    static async updateProfile(id, data) {
        const admin = await AdminUser.findByPk(id);
        if (!admin) throw ApiError.NotFound('Admin user not found');

        if (data.newPassword) {
            const matches = await bcrypt.compare(data.currentPassword, admin.password_hash);
            if (!matches) throw ApiError.BadRequest('Current password is incorrect');
            admin.password_hash = await bcrypt.hash(data.newPassword, 10);
        }
        if (data.name) admin.name = data.name;
        if (data.phone) admin.phone = data.phone;
        admin.updated_at = new Date();
        await admin.save();

        const plain = admin.get({ plain: true });
        delete plain.password_hash;
        return plain;
    }
}

module.exports = AuthService;
