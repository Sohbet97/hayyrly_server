const router = require('express').Router();

const controller = require('../../controller/constants/cityController');
const adminAuth = require('../../middleware/adminAuth');
const requireRole = require('../../middleware/requireRole');
const errorMiddleware = require('../../middleware/errorMiddleware');

router.post('/', adminAuth, requireRole('admin'), controller.createNewCity);
router.get('/', controller.getAllCity);
router.put('/:id', adminAuth, requireRole('admin'), controller.updateCity);
router.delete('/:id', adminAuth, requireRole('admin'), controller.deleteCity);

router.use(errorMiddleware);

module.exports = router;
