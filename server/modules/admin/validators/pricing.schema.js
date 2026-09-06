const yup = require('yup');

const pricingUpdateSchema = yup.object({
    base_price: yup.number().min(0).required(),
    price_per_km: yup.number().min(0).required(),
    free_wait_min: yup.number().min(0).required(),
    wait_price_min: yup.number().min(0).required(),
    commission_percent: yup.number().min(0).max(100).required(),
});

module.exports = { pricingUpdateSchema };
