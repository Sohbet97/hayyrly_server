const OrderModel  = require('../models/Order/orderModel');
const redisClient = require('../service/redisClient');

const FREE_WAIT_MINUTES  = 3;
const WAIT_PRICE_PER_MIN = 0.5; // TMT per minute after free period

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function err(socket, message) {
    socket.emit('order:error', { message });
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

// Passenger creates order → broadcast to all taxis in city
async function handleOrderCreate(io, socket, data) {
    const { userId, startAddress, endAddress, startLat, startLng,
            endLat, endLng, distanceKm, paymentType, basePrice, cityId } = data;

    if (!userId || !startAddress || startLat == null || startLng == null || !cityId) {
        return err(socket, 'userId, startAddress, startLat, startLng, cityId are required');
    }

    const order = await OrderModel.createOrder({
        userId, startAddress,
        endAddress:  endAddress  ?? null,
        startLat, startLng,
        endLat:      endLat      ?? null,
        endLng:      endLng      ?? null,
        distanceKm:  distanceKm  ?? 0,
        paymentType: paymentType ?? 'cash',
        basePrice:   basePrice   ?? 0,
    });

    // passenger joins order room to receive all further updates
    socket.join(`order:${order.id}`);

    socket.emit('order:created', { orderId: order.id, order });

    // notify every taxi registered in this city
    io.to(`taxis:city:${cityId}`).emit('order:new', {
        orderId:     order.id,
        userId,
        startAddress,
        endAddress:  endAddress  ?? null,
        startLat,    startLng,
        endLat:      endLat      ?? null,
        endLng:      endLng      ?? null,
        distanceKm:  distanceKm  ?? 0,
        paymentType: paymentType ?? 'cash',
        basePrice:   basePrice   ?? 0,
    });

    console.log(`📦 Order ${order.id} created | user ${userId} | city ${cityId}`);
}

// Driver accepts order
async function handleOrderAccept(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const { orderId } = data;

    if (!taxiId)  return err(socket, 'Not registered as taxi. Send taxi:register first');
    if (!orderId) return err(socket, 'orderId is required');

    const order = await OrderModel.getOrderById(orderId);
    if (!order)                   return err(socket, 'Order not found');
    if (order.status !== 'created') return err(socket, `Order already ${order.status}`);

    const updated = await OrderModel.updateOrderStatus(orderId, 'accepted', { taxiId });

    socket.join(`order:${orderId}`);
    socket.data.activeOrderId = orderId;

    await redisClient.hSet(`taxi:${taxiId}:meta`, { status: 'busy' });

    io.to(`order:${orderId}`).emit('order:accepted', { orderId, taxiId, order: updated });

    console.log(`✅ Order ${orderId} accepted by taxi ${taxiId}`);
}

async function handleOrderArrived(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const { orderId } = data;

    if (!taxiId)  return err(socket, 'Not registered as taxi');
    if (!orderId) return err(socket, 'orderId is required');

    const updated = await OrderModel.updateOrderStatus(orderId, 'arrived');

    io.to(`order:${orderId}`).emit('order:arrived', { orderId, order: updated });

    console.log(`🚗 Taxi ${taxiId} arrived for order ${orderId}`);
}

// Passenger boarded → calculate waiting price
async function handleOrderOnWay(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const { orderId } = data;

    if (!taxiId)  return err(socket, 'Not registered as taxi');
    if (!orderId) return err(socket, 'orderId is required');

    const waitingSec   = await OrderModel.getWaitingSeconds(orderId);
    const billableMin  = Math.max(0, waitingSec / 60 - FREE_WAIT_MINUTES);
    const waitingPrice = parseFloat((billableMin * WAIT_PRICE_PER_MIN).toFixed(2));

    const updated = await OrderModel.updateOrderStatus(orderId, 'on_way', { waitingPrice });

    io.to(`order:${orderId}`).emit('order:on_way', {
        orderId, waitingSeconds: waitingSec, waitingPrice, order: updated,
    });

    console.log(`🛣️  Order ${orderId} on_way | wait ${waitingSec}s → ${waitingPrice} TMT`);
}

// Driver marks trip as complete → calculate total price
async function handleOrderComplete(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const { orderId } = data;

    if (!taxiId)  return err(socket, 'Not registered as taxi');
    if (!orderId) return err(socket, 'orderId is required');

    const order = await OrderModel.getOrderById(orderId);
    if (!order) return err(socket, 'Order not found');

    const totalPrice = parseFloat((Number(order.base_price) + Number(order.waiting_price)).toFixed(2));
    const updated    = await OrderModel.updateOrderStatus(orderId, 'completed', { totalPrice });

    await redisClient.hSet(`taxi:${taxiId}:meta`, { status: 'free' });
    socket.data.activeOrderId = null;

    io.to(`order:${orderId}`).emit('order:completed', { orderId, totalPrice, order: updated });

    console.log(`🏁 Order ${orderId} completed | total ${totalPrice} TMT`);
}

// User or driver cancels order
async function handleOrderCancel(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const { orderId, cityId } = data;

    if (!orderId) return err(socket, 'orderId is required');

    const order = await OrderModel.getOrderById(orderId);
    if (!order) return err(socket, 'Order not found');

    const cancelStatus = taxiId ? 'cancelled_by_driver' : 'cancelled_by_user';
    const updated      = await OrderModel.updateOrderStatus(orderId, cancelStatus);

    if (taxiId) {
        await redisClient.hSet(`taxi:${taxiId}:meta`, { status: 'free' });
        socket.data.activeOrderId = null;

        // re-broadcast to city so another driver can pick it up
        if (cityId) {
            io.to(`taxis:city:${cityId}`).emit('order:new', {
                orderId:     order.id,
                userId:      order.user_id,
                startAddress: order.start_address,
                endAddress:   order.end_address,
                startLat:    order.start_lat,
                startLng:    order.start_lng,
                endLat:      order.end_lat   ?? null,
                endLng:      order.end_lng   ?? null,
                distanceKm:  order.distance_km,
                paymentType: order.payment_type,
                basePrice:   order.base_price,
            });
        }
    }

    io.to(`order:${orderId}`).emit('order:cancelled', {
        orderId,
        cancelledBy: taxiId ? 'driver' : 'user',
        order: updated,
    });

    console.log(`❌ Order ${orderId} ${cancelStatus}`);
}

// Driver sends GPS track point during ride → save + forward to passenger
async function handleOrderTrack(io, socket, data) {
    const { orderId, lat, lng } = data;

    if (!orderId || lat == null || lng == null) {
        return err(socket, 'orderId, lat, lng are required');
    }

    await OrderModel.addTrackPoint(orderId, lat, lng);

    io.to(`order:${orderId}`).emit('order:track', {
        orderId, lat, lng, taxiId: socket.data.taxiId ?? null,
    });
}

// Passenger/observer joins order room to receive live updates
function handleOrderWatch(socket, data) {
    const { orderId } = data;
    if (!orderId) return;
    socket.join(`order:${orderId}`);
    console.log(`👁 ${socket.id} watching order ${orderId}`);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function initOrderSocket(io, socket) {
    const wrap = (name, fn) => socket.on(name, async (data) => {
        try { await fn(io, socket, data); }
        catch (e) {
            console.error(`${name} error:`, e);
            socket.emit('order:error', { message: 'Internal server error' });
        }
    });

    wrap('order:create',   handleOrderCreate);
    wrap('order:accept',   handleOrderAccept);
    wrap('order:arrived',  handleOrderArrived);
    wrap('order:on_way',   handleOrderOnWay);
    wrap('order:complete', handleOrderComplete);
    wrap('order:cancel',   handleOrderCancel);
    wrap('order:track',    handleOrderTrack);

    socket.on('order:watch', (data) => handleOrderWatch(socket, data));
}

module.exports = { initOrderSocket };
