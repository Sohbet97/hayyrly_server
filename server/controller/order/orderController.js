const OrderModel = require('../../models/Order/orderModel');
const ReviewModel = require('../../models/Review/reviewModel');
const MessageModel = require('../../models/Message/messageModel');
const { CityPricing, User } = require('../../db');

const BASE_PRICE   = parseFloat(process.env.ORDER_BASE_PRICE)   || 10;
const PRICE_PER_KM = parseFloat(process.env.ORDER_PRICE_PER_KM) || 2.5;

async function getOrderPrice(req, res) {
    const distanceKm = parseFloat(req.query.distanceKm);
    if (isNaN(distanceKm) || distanceKm < 0) {
        return res.status(400).json({ status: false, message: 'distanceKm required' });
    }

    let basePrice = BASE_PRICE;
    let pricePerKm = PRICE_PER_KM;

    const cityId = parseInt(req.query.cityId, 10);
    if (!isNaN(cityId)) {
        const pricing = await CityPricing.findOne({ where: { city_id: cityId }, raw: true });
        if (pricing) {
            basePrice = parseFloat(pricing.base_price);
            pricePerKm = parseFloat(pricing.price_per_km);
        }
    }

    const price = Math.round((basePrice + distanceKm * pricePerKm) * 100) / 100;
    return res.json({ status: true, price });
}

async function createOrder(req, res) {
    try {
        const {
            userId,
            startAddress,
            endAddress,
            startLat,
            startLng,
            endLat,
            endLng,
            distanceKm,
            paymentType,
            basePrice,
        } = req.body;

        if (!userId || !startAddress || startLat == null || startLng == null) {
            return res.status(400).json({ status: false, message: 'userId, startAddress, startLat, startLng are required' });
        }

        const user = await User.findByPk(userId, { raw: true });
        if (user?.is_blocked) {
            return res.status(403).json({ status: false, message: 'Your account has been blocked from placing orders' });
        }

        const result = await OrderModel.createOrder({
            userId,
            startAddress,
            endAddress:  endAddress  ?? null,
            startLat,
            startLng,
            endLat:      endLat      ?? null,
            endLng:      endLng      ?? null,
            distanceKm:  distanceKm  ?? 0,
            paymentType: paymentType ?? 'cash',
            basePrice:   basePrice   ?? 0,
        });

        return res.status(201).json({ status: true, result });
    } catch (error) {
        console.error('Error createOrder:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getOrderById(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ status: false, message: 'Invalid order id' });

        const result = await OrderModel.getOrderById(id);
        if (!result) return res.status(404).json({ status: false, message: 'Order not found' });

        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error getOrderById:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getOrdersByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) return res.status(400).json({ status: false, message: 'Invalid userId' });

        const { status, paymentType, limit, page } = req.query;

        const pagination = {
            limit:  limit ? parseInt(limit, 10)  : 20,
            offset: page  ? (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 20) : 0,
        };

        const result = await OrderModel.getOrdersByUser(
            userId,
            { status: status ?? null, paymentType: paymentType ?? null },
            pagination,
        );

        return res.status(200).json({ status: true, ...result });
    } catch (error) {
        console.error('Error getOrdersByUser:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getOrdersByTaxi(req, res) {
    try {
        const taxiId = parseInt(req.params.taxiId, 10);
        if (isNaN(taxiId)) return res.status(400).json({ status: false, message: 'Invalid taxiId' });

        const { status, paymentType, limit, page } = req.query;

        const pagination = {
            limit:  limit ? parseInt(limit, 10)  : 20,
            offset: page  ? (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 20) : 0,
        };

        const result = await OrderModel.getOrdersByTaxi(
            taxiId,
            { status: status ?? null, paymentType: paymentType ?? null },
            pagination,
        );

        return res.status(200).json({ status: true, ...result });
    } catch (error) {
        console.error('Error getOrdersByTaxi:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getActiveOrdersInCity(req, res) {
    try {
        const cityId = parseInt(req.params.cityId, 10);
        if (isNaN(cityId)) return res.status(400).json({ status: false, message: 'Invalid cityId' });

        const { limit, page } = req.query;

        const pagination = {
            limit:  limit ? parseInt(limit, 10)  : 50,
            offset: page  ? (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 50) : 0,
        };

        const result = await OrderModel.getActiveOrdersInCity(cityId, pagination);

        return res.status(200).json({ status: true, ...result });
    } catch (error) {
        console.error('Error getActiveOrdersInCity:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ status: false, message: 'Invalid order id' });

        const { status, taxiId, waitingPrice, totalPrice } = req.body;

        const allowed = ['accepted', 'arrived', 'on_way', 'completed', 'cancelled_by_user', 'cancelled_by_driver'];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ status: false, message: `status must be one of: ${allowed.join(', ')}` });
        }

        const result = await OrderModel.updateOrderStatus(id, status, {
            taxiId:       taxiId       ?? undefined,
            waitingPrice: waitingPrice ?? undefined,
            totalPrice:   totalPrice   ?? undefined,
        });

        if (!result) return res.status(404).json({ status: false, message: 'Order not found' });

        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error updateOrderStatus:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getOrderLogs(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ status: false, message: 'Invalid order id' });

        const result = await OrderModel.getLogsByOrder(id);
        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error getOrderLogs:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getOrderTrack(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ status: false, message: 'Invalid order id' });

        const result = await OrderModel.getTrackByOrder(id);
        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error getOrderTrack:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function createReview(req, res) {
    try {
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) return res.status(400).json({ status: false, message: 'Invalid order id' });

        const { rating, comment } = req.body;
        const parsedRating = parseInt(rating, 10);
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ status: false, message: 'rating must be an integer between 1 and 5' });
        }

        const order = await OrderModel.getOrderById(orderId);
        if (!order) return res.status(404).json({ status: false, message: 'Order not found' });
        if (order.status !== 'completed' || !order.taxi_id) {
            return res.status(409).json({ status: false, message: 'Only completed orders with an assigned taxi can be reviewed' });
        }

        const result = await ReviewModel.createReview({
            orderId,
            userId: order.user_id,
            taxiId: order.taxi_id,
            rating: parsedRating,
            comment: comment ?? null,
        });

        return res.status(201).json({ status: true, result });
    } catch (error) {
        if (error.original?.code === '23505' || error.code === '23505') {
            return res.status(409).json({ status: false, message: 'Order already reviewed' });
        }
        console.error('Error createReview:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getReviewsByTaxi(req, res) {
    try {
        const taxiId = parseInt(req.params.taxiId, 10);
        if (isNaN(taxiId)) return res.status(400).json({ status: false, message: 'Invalid taxiId' });

        const { limit, page } = req.query;
        const pagination = {
            limit:  limit ? parseInt(limit, 10)  : 20,
            offset: page  ? (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 20) : 0,
        };

        const result = await ReviewModel.getReviewsByTaxi(taxiId, pagination);
        return res.status(200).json({ status: true, ...result });
    } catch (error) {
        console.error('Error getReviewsByTaxi:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getReviewsByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) return res.status(400).json({ status: false, message: 'Invalid userId' });

        const { limit, page } = req.query;
        const pagination = {
            limit:  limit ? parseInt(limit, 10)  : 20,
            offset: page  ? (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 20) : 0,
        };

        const result = await ReviewModel.getReviewsByUser(userId, pagination);
        return res.status(200).json({ status: true, ...result });
    } catch (error) {
        console.error('Error getReviewsByUser:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function getOrderMessages(req, res) {
    try {
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) return res.status(400).json({ status: false, message: 'Invalid order id' });

        const { limit, page } = req.query;
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const offset = page ? (parseInt(page, 10) - 1) * parsedLimit : 0;

        const result = await MessageModel.getMessagesByOrder(orderId, { limit: parsedLimit, offset });
        return res.status(200).json({ status: true, result });
    } catch (error) {
        console.error('Error getOrderMessages:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

async function postOrderMessage(req, res) {
    try {
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) return res.status(400).json({ status: false, message: 'Invalid order id' });

        const { senderType, senderId, body } = req.body;
        if (!senderType || !body) {
            return res.status(400).json({ status: false, message: 'senderType, body are required' });
        }
        if (!['client', 'driver'].includes(senderType)) {
            return res.status(400).json({ status: false, message: "senderType must be 'client' or 'driver'" });
        }

        const message = await MessageModel.addMessage({ orderId, senderType, senderId: senderId ?? null, body });

        const io = req.app.get('io');
        if (io) io.to(`order:${orderId}`).emit('chat:message', message);

        return res.status(201).json({ status: true, result: message });
    } catch (error) {
        console.error('Error postOrderMessage:', error);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
}

module.exports = {
    getOrderPrice,
    createOrder,
    getOrderById,
    getOrdersByUser,
    getOrdersByTaxi,
    getActiveOrdersInCity,
    updateOrderStatus,
    getOrderLogs,
    getOrderTrack,
    createReview,
    getReviewsByTaxi,
    getReviewsByUser,
    getOrderMessages,
    postOrderMessage,
};
