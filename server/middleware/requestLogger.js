const logger = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: Number(durationMs.toFixed(1)),
            ip: req.ip,
        });
    });

    next();
};
