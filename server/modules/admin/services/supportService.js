const SupportModel = require('../../../models/Support/supportModel');
const ApiError = require('../../../exceptions/api-error');

class SupportService {
    static async listThreads({ limit, page } = {}) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        return SupportModel.listThreads({ limit: parsedLimit, offset });
    }

    static async getMessages(userId, { limit, page } = {}) {
        const parsedLimit = parseInt(limit, 10) || 50;
        const parsedPage = parseInt(page, 10) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const messages = await SupportModel.getMessagesByUser(userId, { limit: parsedLimit, offset });
        await SupportModel.markUserMessagesRead(userId);
        return messages;
    }

    static async reply(userId, adminId, { message, photoUrl }) {
        if (!message && !photoUrl) throw ApiError.BadRequest('message or photoUrl is required');

        return SupportModel.addMessage({
            userId, senderType: 'admin', senderId: adminId, message: message ?? null, photoUrl: photoUrl ?? null,
        });
    }
}

module.exports = SupportService;
