const router = require('express').Router();
const errorMiddleware = require('../../../middleware/errorMiddleware');
const PricingController = require('../controllers/pricingController');

// Public — mobile apps read pricing to calculate/display a price. GET /api/pricing/:cityId
router.get('/:cityId', PricingController.getPublic);

router.use(errorMiddleware);

module.exports = router;
