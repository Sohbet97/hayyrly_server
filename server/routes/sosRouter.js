const router = require('express').Router();
const controller = require('../controller/sos/sosController');

// POST   /api/sos                           — SOS signal iberme (REST fallback, socket ýok bolsa)
router.post('/', controller.createSosAlert);

module.exports = router;
