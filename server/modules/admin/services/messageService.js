const MessageModel = require('../../../models/Message/messageModel');

class MessageService {
    static async listByOrder(orderId) {
        return MessageModel.getMessagesByOrder(orderId);
    }

    static async create({ orderId, senderId, body, io }) {
        const message = await MessageModel.addMessage({
            orderId,
            senderType: 'admin',
            senderId,
            body,
        });
        if (io) io.to(`order:${orderId}`).emit('chat:message', message);
        return message;
    }
}

module.exports = MessageService;
