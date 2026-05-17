const router = require('express').Router();

const controller = require('../../controller/constants/serviceController');

router.post('/', controller.createService);
router.get('/', controller.getAllServices);
router.put('/:id', controller.updateService);
router.delete('/:id', controller.deleteService);



module.exports = router;