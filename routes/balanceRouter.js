const router = require('express').Router();
const controller = require('../controller/user/balanceController');

router.post('/:id/add', controller.addBalanceInUSer);
router.post('/:id/remove', controller.removeBalanceInUser);
router.get('/:id', controller.getBalanceInUser);

module.exports = router;