const router = require('express').Router();
const controller = require('../../controller/order/orderController');

// GET    /api/orders/price                  — baha hasaplamak  ?distanceKm=&cityId=
router.get('/price', controller.getOrderPrice);

// POST   /api/orders                        — täze sargyt döretmek
router.post('/', controller.createOrder);

// GET    /api/orders/:id                    — sargyt maglumaty
router.get('/:id', controller.getOrderById);

// PATCH  /api/orders/:id/status             — status üýtgetmek (accept, arrive, complete...)
router.patch('/:id/status', controller.updateOrderStatus);

// GET    /api/orders/:id/logs               — status taryhы
router.get('/:id/logs', controller.getOrderLogs);

// GET    /api/orders/:id/track              — ýol treký (GPS nokatlar)
router.get('/:id/track', controller.getOrderTrack);

// GET    /api/orders/user/:userId           — ulanyjynyň sargytlary  ?status=&paymentType=&limit=&page=
router.get('/user/:userId', controller.getOrdersByUser);

// GET    /api/orders/taxi/:taxiId           — sürüjüniň sargytlary   ?status=&paymentType=&limit=&page=
router.get('/taxi/:taxiId', controller.getOrdersByTaxi);

// GET    /api/orders/city/:cityId/active    — şäherdäki açyk sargytlar ?limit=&page=
router.get('/city/:cityId/active', controller.getActiveOrdersInCity);

module.exports = router;
