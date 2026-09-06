const router = require('express').Router();
const controller = require('../controller/support/supportController');

// POST   /api/support/messages              — ulanyjy admin-e habar iberýär
router.post('/messages', controller.postMessage);

// GET    /api/support/user/:userId/messages — ulanyjynyň admin bilen ýazyşmasy ?limit=&page=
router.get('/user/:userId/messages', controller.getMessages);

module.exports = router;
