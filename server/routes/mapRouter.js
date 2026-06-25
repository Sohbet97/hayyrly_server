const express = require('express');
const router  = express.Router();
const { getLocationName } = require('../models/mapModel');

router.get('/location/name', async (req, res) => {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).json({ status: false, message: 'lat and lng required' });

    const radiusMeters = Math.min(parseFloat(radius) || 50, 500);

    try {
        const place = await getLocationName(parseFloat(lng), parseFloat(lat), radiusMeters);
        if (!place) return res.status(404).json({ status: false, found: false });
        return res.json({ status: true, found: true, ...place });
    } catch (err) {
        return res.status(500).json({ status: false, message: err.message });
    }
});

module.exports = router;
