const SettingsService = require('../services/settingsService');
const Validator = require('../../../utils/validator');
const { settingsUpdateSchema, notifPrefsUpdateSchema } = require('../validators/settings.schema');
const ApiError = require('../../../exceptions/api-error');

class SettingsController {
    static async get(req, res, next) {
        try {
            const result = await SettingsService.getSettings();
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async update(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(settingsUpdateSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await SettingsService.updateSettings(req.body);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async getNotifPrefs(req, res, next) {
        try {
            const result = await SettingsService.getNotifPrefs(req.admin.id);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async updateNotifPrefs(req, res, next) {
        try {
            const { isError, errors } = await Validator.validate(notifPrefsUpdateSchema, req.body);
            if (isError) throw ApiError.BadRequest(null, errors);

            const result = await SettingsService.updateNotifPrefs(req.admin.id, req.body);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = SettingsController;
