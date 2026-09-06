const router = require('express').Router();
const controller = require('../../controller/taksi/taksiController');

const uploadFactory = require('../../middleware/uploadFactory');

const avatarUpload = uploadFactory({
    baseFolder: 'taksi',
    fields: [
        { name: 'avatar', maxCount: 1 },
        { name: 'carImage', maxCount: 1 },
    ],
});

router.post('/createNew', ...avatarUpload, controller.createNewTaksi);
router.get('/nearby', controller.getNearbyTaxis);
router.get('/user/:userId', controller.getTaksiByUserId);
router.get('/:id', controller.getTaksiById);
router.put('/:id', ...avatarUpload, controller.updateTaksi);
router.delete('/:id', controller.deleteTaksi);


module.exports = router;
