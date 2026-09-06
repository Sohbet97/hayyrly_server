const MessageModel = require('../../../models/Message/messageModel');

// Read-only: admins view order chat (driver↔client) for oversight only — see
// modules/admin/controllers/messageController.js.
class MessageService {
    static async listByOrder(orderId) {
        return MessageModel.getMessagesByOrder(orderId);
    }
}

module.exports = MessageService;
