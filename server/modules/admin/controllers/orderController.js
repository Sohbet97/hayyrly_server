const OrderService = require('../services/orderService');

class OrderController {
    static async list(req, res, next) {
        try {
            const { status, cityId, limit, page } = req.query;
            const result = await OrderService.list({
                status,
                cityId: cityId ? parseInt(cityId, 10) : undefined,
                limit, page,
            });
            return res.status(200).json({ status: true, ...result });
        } catch (e) { next(e); }
    }

    static async dailyReport(req, res, next) {
        try {
            const { days, from, to, cityId } = req.query;
            const data = await OrderService.dailyReport({ days, from, to, cityId: cityId ? parseInt(cityId, 10) : undefined });
            return res.status(200).json({ status: true, data });
        } catch (e) { next(e); }
    }

    static async summary(req, res, next) {
        try {
            const { from, to, cityId } = req.query;
            const result = await OrderService.summary({ from, to, cityId: cityId ? parseInt(cityId, 10) : undefined });
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async ordersByCity(req, res, next) {
        try {
            const { days, from, to } = req.query;
            const data = await OrderService.ordersByCity({ days, from, to });
            return res.status(200).json({ status: true, data });
        } catch (e) { next(e); }
    }

    static async cancellationSplit(req, res, next) {
        try {
            const { days, from, to, cityId } = req.query;
            const result = await OrderService.cancellationSplit({ days, from, to, cityId: cityId ? parseInt(cityId, 10) : undefined });
            return res.status(200).json({ status: true, result });
        } catch (e) { next(e); }
    }

    static async peakHours(req, res, next) {
        try {
            const { days, from, to, cityId } = req.query;
            const data = await OrderService.peakHours({ days, from, to, cityId: cityId ? parseInt(cityId, 10) : undefined });
            return res.status(200).json({ status: true, data });
        } catch (e) { next(e); }
    }
}

module.exports = OrderController;
