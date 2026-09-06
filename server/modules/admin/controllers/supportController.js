const SupportService = require('../services/supportService');

class SupportController {
    static async listThreads(req, res, next) {
        try {
            const { limit, page } = req.query;
            const result = await SupportService.listThreads({ limit, page });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async getMessages(req, res, next) {
        try {
            const { limit, page } = req.query;
            const result = await SupportService.getMessages(req.params.userId, { limit, page });
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async reply(req, res, next) {
        try {
            const { message, photoUrl } = req.body;
            const result = await SupportService.reply(req.params.userId, req.admin.id, { message, photoUrl });

            const io = req.app.get('io');
            if (io) io.to(`support:user:${req.params.userId}`).emit('support:message', result);

            return res.status(201).json({ status: true, result });
        } catch (e) { next(e); }
    }
}

module.exports = SupportController;
