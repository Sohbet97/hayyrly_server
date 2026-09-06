const router = require('express').Router();
const adminAuth = require('../../../middleware/adminAuth');
const requireRole = require('../../../middleware/requireRole');
const errorMiddleware = require('../../../middleware/errorMiddleware');
const uploadFactory = require('../../../middleware/uploadFactory');

const AuthController = require('../controllers/authController');
const PricingController = require('../controllers/pricingController');
const DriverController = require('../controllers/driverController');
const ClientController = require('../controllers/clientController');
const OrderController = require('../controllers/orderController');
const MessageController = require('../controllers/messageController');
const TransactionController = require('../controllers/transactionController');
const PaymentController = require('../controllers/paymentController');
const TeamController = require('../controllers/teamController');
const ApplicationController = require('../controllers/applicationController');
const SettingsController = require('../controllers/settingsController');
const CityController = require('../controllers/cityController');
const CarController = require('../controllers/carController');
const SosController = require('../controllers/sosController');
const BalanceRequestController = require('../controllers/balanceRequestController');
const SupportController = require('../controllers/supportController');

router.post('/auth/login', AuthController.login);

router.use(adminAuth); // everything below requires a valid admin (Bearer, typ:'admin') token

router.get('/auth/me', AuthController.me);
router.put('/auth/me', AuthController.updateMe);

const driverMediaUpload = uploadFactory({
    baseFolder: 'taxies',
    fields: [
        { name: 'avatar', maxCount: 1 },
        { name: 'carImage', maxCount: 1 },
    ],
});

router.get('/drivers', DriverController.list);
router.post('/drivers', ...driverMediaUpload, DriverController.create);
router.get('/drivers/:userId', DriverController.getById);
router.get('/drivers/:userId/orders', DriverController.getOrders);
router.put('/drivers/:userId', ...driverMediaUpload, DriverController.update);
router.put('/drivers/:userId/status', DriverController.setActive);
router.post('/drivers/:userId/balance', DriverController.adjustBalance);

router.get('/cars/markas', CarController.listMarkas);

router.get('/clients', ClientController.list);
router.get('/clients/:userId/orders', ClientController.getOrders);
router.put('/clients/:userId/status', ClientController.setBlocked);

router.get('/orders', OrderController.list);
router.get('/orders/:id', OrderController.getById);
router.get('/orders/:id/messages', MessageController.list); // read-only oversight — order chat is driver↔client only
router.get('/reports/orders', OrderController.summary);
router.get('/analytics/daily', OrderController.dailyReport);
router.get('/analytics/by-city', OrderController.ordersByCity);
router.get('/analytics/cancellations', OrderController.cancellationSplit);
router.get('/analytics/peak-hours', OrderController.peakHours);

router.get('/cities', CityController.list);
router.post('/cities', requireRole('admin'), CityController.create);
router.delete('/cities/:id', requireRole('admin'), CityController.remove);

router.get('/transactions', TransactionController.list);

router.get('/payments', PaymentController.list);
router.get('/payments/summary', PaymentController.summary);
router.post('/payments/:id/refund', PaymentController.refund);

router.get('/support', SupportController.listThreads);
router.get('/support/:userId/messages', SupportController.getMessages);
router.post('/support/:userId/messages', SupportController.reply);

router.get('/sos', SosController.list);
router.put('/sos/:id/status', SosController.updateStatus);

router.get('/balance-requests', BalanceRequestController.list);
router.get('/balance-requests/:id', BalanceRequestController.getById);
router.put('/balance-requests/:id/confirm', BalanceRequestController.confirm);
router.put('/balance-requests/:id/reject', BalanceRequestController.reject);
router.post('/balance-requests/:id/messages', BalanceRequestController.postAdminMessage);

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
