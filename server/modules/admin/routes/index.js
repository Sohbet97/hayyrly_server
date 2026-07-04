const router = require('express').Router();
const adminAuth = require('../../../middleware/adminAuth');
const requireRole = require('../../../middleware/requireRole');
const errorMiddleware = require('../../../middleware/errorMiddleware');

const AuthController = require('../controllers/authController');
const PricingController = require('../controllers/pricingController');
const DriverController = require('../controllers/driverController');
const OrderController = require('../controllers/orderController');
const TransactionController = require('../controllers/transactionController');
const TeamController = require('../controllers/teamController');
const ApplicationController = require('../controllers/applicationController');

router.post('/auth/login', AuthController.login);

router.use(adminAuth); // everything below requires a valid admin (Bearer, typ:'admin') token

router.get('/auth/me', AuthController.me);

router.get('/drivers', DriverController.list);
router.post('/drivers/:userId/balance', DriverController.adjustBalance);

router.get('/orders', OrderController.list);
router.get('/reports/orders', OrderController.summary);
router.get('/analytics/daily', OrderController.dailyReport);

router.get('/transactions', TransactionController.list);

router.get('/driver-applications', ApplicationController.list);
router.get('/driver-applications/:id', ApplicationController.getById);
router.put('/driver-applications/:id/approve', ApplicationController.approve);
router.put('/driver-applications/:id/reject', ApplicationController.reject);

router.get('/pricing', PricingController.list);
router.put('/pricing/:cityId', requireRole('admin'), PricingController.update);

router.get('/team', requireRole('admin'), TeamController.list);
router.post('/team', requireRole('admin'), TeamController.create);
router.put('/team/:id', requireRole('admin'), TeamController.update);
router.delete('/team/:id', requireRole('admin'), TeamController.remove);

router.use(errorMiddleware);

module.exports = router;
