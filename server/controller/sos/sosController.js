const SosModel = require('../../models/Sos/sosModel');

async function createSosAlert(req, res) {
    try {
        const { orderId, userId, taxiId, phone, note, lat, lng } = req.body;

        if (!phone || lat == null || lng == null) {
            return res.status(400).json({ status: false, message: 'phone, lat, lng are required' });
        }

        const alert = await SosModel.createSosAlert({
            orderId: orderId ?? null,
            userId:  userId  ?? null,
            taxiId:  taxiId  ?? null,
            phone, note: note ?? null, lat, lng,
        });

        const io = req.app.get('io');
        if (io) io.to('admin:sos').emit('sos:alert', alert);

        return res.status(201).json({ status: true, result: alert });
    } catch (error) {
        console.error('Error createSosAlert:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

module.exports = { createSosAlert };
