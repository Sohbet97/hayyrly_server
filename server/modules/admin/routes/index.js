const router = require('express').Router();
const adminAuth = require('../../../middleware/adminAuth');
const requireRole = require('../../../middleware/requireRole');
const errorMiddleware = require('../../../middleware/errorMiddleware');

const AuthController = require('../controllers/authController');
const PricingController = require('../controllers/pricingController');
const DriverController = require('../controllers/driverController');
const ClientController = require('../controllers/clientController');
const OrderController = require('../controllers/orderController');
const TransactionController = require('../controllers/transactionController');
const PaymentController = require('../controllers/paymentController');
const TeamController = require('../controllers/teamController');
const ApplicationController = require('../controllers/applicationController');
const SettingsController = require('../controllers/settingsController');
const CityController = require('../controllers/cityController');

router.post('/auth/login', AuthController.login);

router.use(adminAuth); // everything below requires a valid admin (Bearer, typ:'admin') token

router.get('/auth/me', AuthController.me);
router.put('/auth/me', AuthController.updateMe);

router.get('/drivers', DriverController.list);
router.put('/drivers/:userId/status', DriverController.setActive);
router.post('/drivers/:userId/balance', DriverController.adjustBalance);

router.get('/clients', ClientController.list);
router.get('/clients/:userId/orders', ClientController.getOrders);
router.put('/clients/:userId/status', ClientController.setBlocked);

router.get('/orders', OrderController.list);
router.get('/reports/orders', OrderController.summary);
router.get('/analytics/daily', OrderController.dailyReport);
router.get('/analytics/by-city', OrderController.ordersByCity);
router.get('/analytics/cancellations', OrderController.cancellationSplit);
router.get('/analytics/peak-hours', OrderController.peakHours);

router.get('/cities', CityController.list);
router.post('/cities', requireRole('admin'), CityController.create);

router.get('/transactions', TransactionController.list);

router.get('/payments', PaymentController.list);
router.get('/payments/summary', PaymentController.summary);
router.post('/payments/:id/refund', PaymentController.refund);

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

router.get('/settings', SettingsController.get);
router.put('/settings', requireRole('admin'), SettingsController.update);
router.get('/settings/notifications', SettingsController.getNotifPrefs);
router.put('/settings/notifications', SettingsController.updateNotifPrefs);

router.use(errorMiddleware);

module.exports = router;
