const ApiError = require('../exceptions/api-error');
const logger = require('../utils/logger');

// Mounted on the admin router only — legacy /api/* controllers keep their own
// inline try/catch + res.json error handling untouched.
module.exports = function errorMiddleware(err, req, res, next) {
    logger.error('Admin API error', { error: err.message, stack: err.stack });

    if (err instanceof ApiError) {
        return res.status(err.status).json({ status: false, message: err.message, errors: err.errors });
    }

    return res.status(500).json({ status: false, message: 'Internal Server Error' });
};
