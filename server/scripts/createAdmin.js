// Usage: node scripts/createAdmin.js <phone> <password> <name> [role=admin]
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { AdminUser, sequelize } = require('../db');

async function main() {
    const [phone, password, name, role = 'admin'] = process.argv.slice(2);

    if (!phone || !password || !name) {
        console.error('Usage: node scripts/createAdmin.js <phone> <password> <name> [role=admin]');
        process.exit(1);
    }

    if (!['admin', 'operator'].includes(role)) {
        console.error('role must be "admin" or "operator"');
        process.exit(1);
    }

    await sequelize.authenticate();

    const password_hash = await bcrypt.hash(password, 10);
    const [admin, created] = await AdminUser.findOrCreate({
        where: { phone },
        defaults: { name, phone, password_hash, role },
    });

    if (!created) {
        await admin.update({ name, password_hash, role, is_active: true });
        console.log(`Updated existing admin user: ${phone}`);
    } else {
        console.log(`Created admin user: ${phone}`);
    }

    await sequelize.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
