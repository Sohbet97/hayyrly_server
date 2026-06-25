const router = require('express').Router();

const controller = require('../../controller/constants/cityController');

router.post('/', controller.createNewCity);
router.get('/', controller.getAllCity);
router.put('/:id', controller.updateCity);
router.delete('/:id', controller.deleteCity);



module.exports = router;