const SosModel = require('../../../models/Sos/sosModel');
const ApiError = require('../../../exceptions/api-error');

const ALLOWED_STATUSES = ['open', 'acknowledged', 'resolved'];

class SosService {
    static async list({ status, limit, page } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        return SosModel.listAlerts({ status: status ?? null }, { limit: parsedLimit, offset });
    }

    static async updateStatus(id, status) {
        if (!ALLOWED_STATUSES.includes(status)) {
            throw ApiError.BadRequest(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
        }

        const alert = await SosModel.updateAlertStatus(id, status);
        if (!alert) throw ApiError.NotFound('SOS alert not found');

        return alert;
    }
}

module.exports = SosService;
