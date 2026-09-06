const SosService = require('../services/sosService');

class SosController {
    static async list(req, res, next) {
        try {
            const { status, limit, page } = req.query;
            const result = await SosService.list({ status, limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async updateStatus(req, res, next) {
        try {
            const result = await SosService.updateStatus(req.params.id, req.body.status);
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = SosController;
