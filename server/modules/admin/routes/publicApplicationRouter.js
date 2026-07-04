const router = require('express').Router();
const errorMiddleware = require('../../../middleware/errorMiddleware');
const ApplicationController = require('../controllers/applicationController');

// Public — mobile client submits a driver signup application. POST /api/driver-applications
router.post('/', ApplicationController.submit);

router.use(errorMiddleware);

module.exports = router;
