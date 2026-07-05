const router = require('express').Router();
const controller = require('../controller/user/balanceController');

router.post('/:id/add', controller.addBalanceInUSer);
router.post('/:id/remove', controller.removeBalanceInUser);
router.get('/:id/log', controller.getLogByUser);
router.get('/:id', controller.getBalanceInUserId);

module.exports = router;