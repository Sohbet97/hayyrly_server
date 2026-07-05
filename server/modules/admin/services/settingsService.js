const { AdminSettings, AdminNotificationPref } = require('../../../db');

class SettingsService {
    static async getSettings() {
        const [row] = await AdminSettings.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
        return row.get({ plain: true });
    }

    static async updateSettings(data) {
        await AdminSettings.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
        await AdminSettings.update({ ...data, updated_at: new Date() }, { where: { id: 1 } });
        const row = await AdminSettings.findByPk(1);
        return row.get({ plain: true });
    }

    static async getNotifPrefs(adminId) {
        const [row] = await AdminNotificationPref.findOrCreate({
            where: { admin_id: adminId },
            defaults: { admin_id: adminId },
        });
        return row.get({ plain: true });
    }

    static async updateNotifPrefs(adminId, data) {
        await AdminNotificationPref.findOrCreate({ where: { admin_id: adminId }, defaults: { admin_id: adminId } });
        await AdminNotificationPref.update({ ...data, updated_at: new Date() }, { where: { admin_id: adminId } });
        const row = await AdminNotificationPref.findByPk(adminId);
        return row.get({ plain: true });
    }
}

module.exports = SettingsService;
