const SupportModel = require('../../models/Support/supportModel');

async function postMessage(req, res) {
    try {
        const { userId, message, photoUrl } = req.body;
        if (!userId || (!message && !photoUrl)) {
            return res.status(400).json({ status: false, message: 'userId and (message or photoUrl) are required' });
        }

        const result = await SupportModel.addMessage({
            userId, senderType: 'user', senderId: userId, message: message ?? null, photoUrl: photoUrl ?? null,
        });

        const io = req.app.get('io');
        if (io) io.to('admin:support').emit('support:message', result);

        return res.status(201).json({ status: true, result });
    } catch (error) {
        console.error('Error postMessage (support):', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getMessages(req, res) {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) return res.status(400).json({ status: false, message: 'Invalid userId' });

        const { limit, page } = req.query;
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const offset = page ? (parseInt(page, 10) - 1) * parsedLimit : 0;

        const result = await SupportModel.getMessagesByUser(userId, { limit: parsedLimit, offset });
        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error getMessages (support):', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

module.exports = { postMessage, getMessages };
