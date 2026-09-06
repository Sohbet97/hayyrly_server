const router = require('express').Router();
const errorMiddleware = require('../../../middleware/errorMiddleware');
const BalanceRequestController = require('../controllers/balanceRequestController');

// Public — mobile client submits/lists balance top-up requests and their chat thread.
router.post('/', BalanceRequestController.submit);                     // POST /api/balance-requests
router.get('/user/:userId', BalanceRequestController.listByUser);      // GET  /api/balance-requests/user/:userId
router.get('/:id/messages', BalanceRequestController.listMessages);    // GET  /api/balance-requests/:id/messages
router.post('/:id/messages', BalanceRequestController.postMessage);    // POST /api/balance-requests/:id/messages

router.use(errorMiddleware);

module.exports = router;
