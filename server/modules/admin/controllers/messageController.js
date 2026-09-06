const MessageService = require('../services/messageService');

// Read-only: order chat is driver↔client only. Admins view it here for oversight but
// message the user through the separate support chat (SupportController), not into
// an order's thread.
class MessageController {
    static async list(req, res, next) {
        try {
            const { id } = req.params;
            const messages = await MessageService.listByOrder(id);
            return res.status(200).json({ status: true, messages });
        } catch (e) { next(e); }
    }
}

module.exports = MessageController;
