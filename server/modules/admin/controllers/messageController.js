const MessageService = require('../services/messageService');

class MessageController {
    static async list(req, res, next) {
        try {
            const { id } = req.params;
            const messages = await MessageService.listByOrder(id);
            return res.status(200).json({ status: true, messages });
        } catch (e) { next(e); }
    }

    static async create(req, res, next) {
        try {
            const { id } = req.params;
            const { body } = req.body;
            if (!body || !body.trim()) {
                return res.status(400).json({ status: false, message: 'body is required' });
            }
            const message = await MessageService.create({
                orderId: id,
                senderId: req.admin.id,
                body,
                io: req.app.get('io'),
            });
            return res.status(201).json({ status: true, message });
        } catch (e) { next(e); }
    }
}

module.exports = MessageController;
