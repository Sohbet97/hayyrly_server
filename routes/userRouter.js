const router = require('express').Router();
const controller = require('../controller/user/userController');
const authController = require('../controller/user/authController');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');



router.post('/createNew', controller.createNewUser);
router.get('/:id', controller.getUserById);
router.delete('/:id', controller.deleteUserData);



// otp
router.post('/sendCode', authController.generateAdnSendOtp);
router.post('/verifyOtp', authController.verificationOtp);

module.exports = router;
