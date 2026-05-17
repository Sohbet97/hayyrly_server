const router = require('express').Router();
const controller = require('../../controller/taksi/taksiController');


const uploadFactory = require('../../middleware/uploadFactory');

const avatarUpload = uploadFactory({ baseFolder: 'taksi', fieldName: 'avatar', maxCount: 2 });



router.post('/createNew', ...avatarUpload, controller.createNewTaksi);
router.delete('/:id', controller.deleteTaksi);


module.exports = router;
