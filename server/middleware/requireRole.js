const ApiError = require('../exceptions/api-error');

// requireRole('admin') — must run after adminAuth (needs req.admin).
module.exports = function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.admin || !roles.includes(req.admin.role)) {
            return next(ApiError.NotAllowed());
        }
        next();
    };
};
