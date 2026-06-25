const router = require('express').Router();
const controller = require('../controller/user/userController');
const authController = require('../controller/user/authController');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');


const uploadFactory = require('../middleware/uploadFactory');

const avatarUpload = uploadFactory({ baseFolder: 'avatars', fieldName: 'avatar', maxCount: 1 });




router.post('/createNew', controller.createNewUser);
router.get('/:id', controller.getUserById);
router.delete('/:id', controller.deleteUserData);
router.put('/:id', ...avatarUpload, controller.updateuserData);


// otp
router.post('/sendCode', authController.generateAdnSendOtp);
router.post('/verifyOtp', authController.verificationOtp);

module.exports = router;
