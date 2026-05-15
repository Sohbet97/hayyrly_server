const router = require('express').Router();
const controller = require('../controller/addressController');

router.post('/create', controller.createNewAddress);
router.get('/', controller.getAddress);
router.put('/:id', controller.updateAddress);
router.delete('/:id', controller.deleteAddress);

module.exports = router;