const router = require('express').Router();
const controller = require('../../controller/constants/markaController');
const uploadFactory = require('../../middleware/uploadFactory');

const imageUpload = uploadFactory({
    baseFolder: 'models',
    fieldName: 'image',
    maxCount: 1
});
router.post('/createMarka', ...imageUpload, controller.createNewMarka);
router.delete('/:id', controller.deleteMarka);
router.put('/:id', controller.updateMarka);
router.get('/', controller.getAllMarkaAndMode);
    // Логика конвертации координат при сохранении в модель

// models
router.post('/createNewModel', controller.createNewMode);
router.put('/model/:id', controller.updateModel);
router.delete('/model/:id', controller.deleteModel);
router.get('/model/', controller.getAllModes);

module.exports = router;