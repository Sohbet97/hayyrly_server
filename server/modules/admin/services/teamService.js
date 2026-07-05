const bcrypt = require('bcryptjs');
const { AdminUser } = require('../../../db');
const ApiError = require('../../../exceptions/api-error');

class TeamService {
    static async list() {
        return AdminUser.findAll({
            attributes: { exclude: ['password_hash'] },
            order: [['id', 'ASC']],
            raw: true,
        });
    }

    static async create(data) {
        const password_hash = await bcrypt.hash(data.password, 10);
        const row = await AdminUser.create({
            name: data.name,
            phone: data.phone,
            password_hash,
            role: data.role || 'operator',
        });
        const plain = row.get({ plain: true });
        delete plain.password_hash;
        return plain;
    }

    static async update(id, data) {
        const updates = {};
        if (data.name) updates.name = data.name;
        if (data.phone) updates.phone = data.phone;
        if (data.role) updates.role = data.role;
        if (data.is_active !== undefined) updates.is_active = data.is_active;
        if (data.password) updates.password_hash = await bcrypt.hash(data.password, 10);
        updates.updated_at = new Date();

        const [affected, rows] = await AdminUser.update(updates, { where: { id }, returning: true });
        if (affected === 0) throw ApiError.NotFound('Admin user not found');

        const plain = rows[0].get({ plain: true });
        delete plain.password_hash;
        return plain;
    }

    static async remove(id) {
        const destroyed = await AdminUser.destroy({ where: { id } });
        if (destroyed === 0) throw ApiError.NotFound('Admin user not found');
    }
}

module.exports = TeamService;
