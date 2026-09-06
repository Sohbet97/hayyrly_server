const OrderModel     = require('../models/Order/orderModel');
const MessageModel   = require('../models/Message/messageModel');
const BalanceModel   = require('../models/User/balanceModel');
const redisClient    = require('../service/redisClient');
const smsService     = require('../service/smsService');
const { Taxi, CityPricing, User } = require('../db');

// Fallback when a taxi's city has no pricing_config row.
const DEFAULT_FREE_WAIT_MINUTES  = 3;
const DEFAULT_WAIT_PRICE_PER_MIN = 0.5; // TMT per minute after free period

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function err(socket, message) {
    socket.emit('order:error', { message });
}

// Deducts the city's configured commission % from the driver's balance on order completion.
// Runs after the order is already marked completed — a balance/insufficient-funds failure
// must never block the ride from completing, so callers catch this separately.
//
// - paymentType 'balance' (client paid in-app): normal guarded debit — if the driver's
//   balance can't cover it, the deduction is skipped/fails and only logged.
// - anything else (cash paid straight to the driver): the platform still collects its
//   cut, so the debit is forced through even if it pushes the balance negative (debt).
async function deductCommission(taxiId, orderId, totalPrice, paymentType) {
    const taxi = await Taxi.findByPk(taxiId, { raw: true });
    if (!taxi?.user_id || !taxi?.city_id) return;

    const pricing = await CityPricing.findOne({ where: { city_id: taxi.city_id }, raw: true });
    const commissionPercent = pricing ? Number(pricing.commission_percent) : 0;
    if (!commissionPercent) return;

    const commissionAmount = parseFloat((totalPrice * commissionPercent / 100).toFixed(2));
    if (!commissionAmount) return;

    await BalanceModel.removeBalanceInUSer({
        userId: taxi.user_id,
        price: commissionAmount,
        sendedUserId: taxi.user_id,
        sendedName: 'Sistema',
        confirmedName: `Komissiýa — sargyt #${orderId}`,
    }, { allowNegative: paymentType !== 'balance' });
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

// Passenger creates order → broadcast to all taxis in city
async function handleOrderCreate(io, socket, data) {
    const { userId, startAddress, endAddress, startLat, startLng,
            endLat, endLng, distanceKm, paymentType, basePrice, cityId } = data;

    if (!userId || !startAddress || startLat == null || startLng == null || !cityId) {
        return err(socket, 'userId, startAddress, startLat, startLng, cityId are required');
    }

    const user = await User.findByPk(userId, { raw: true });
    if (user?.is_blocked) {
        return err(socket, 'Your account has been blocked from placing orders');
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

    // notify admin panel — separate room, full order row (server/socket/sosSocket.js: admin:register)
    io.to('admin:orders').emit('order:new', order);

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

    smsService.sendByUserId(order.user_id, `Sargydyňyz kabul edildi. Taksi ID: ${taxiId}`)
        .catch((e) => console.error('sms order:accepted:', e));

    console.log(`✅ Order ${orderId} accepted by taxi ${taxiId}`);
}

async function handleOrderArrived(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const { orderId } = data;

    if (!taxiId)  return err(socket, 'Not registered as taxi');
    if (!orderId) return err(socket, 'orderId is required');

    const updated = await OrderModel.updateOrderStatus(orderId, 'arrived');

    io.to(`order:${orderId}`).emit('order:arrived', { orderId, order: updated });

    smsService.sendByUserId(updated.user_id, 'Taksiňyz geldi. Garaşýar.')
        .catch((e) => console.error('sms order:arrived:', e));

    console.log(`🚗 Taxi ${taxiId} arrived for order ${orderId}`);
}

// Passenger boarded → calculate waiting price
async function handleOrderOnWay(io, socket, data) {
    const taxiId = socket.data.taxiId;
    const { orderId } = data;

    if (!taxiId)  return err(socket, 'Not registered as taxi');
    if (!orderId) return err(socket, 'orderId is required');

    const waitingSec = await OrderModel.getWaitingSeconds(orderId);

    const taxi    = await Taxi.findByPk(taxiId, { raw: true });
    const pricing = taxi?.city_id ? await CityPricing.findOne({ where: { city_id: taxi.city_id }, raw: true }) : null;
    const freeWaitMinutes  = pricing ? Number(pricing.free_wait_min)  : DEFAULT_FREE_WAIT_MINUTES;
    const waitPricePerMin  = pricing ? Number(pricing.wait_price_min) : DEFAULT_WAIT_PRICE_PER_MIN;

    const billableMin  = Math.max(0, waitingSec / 60 - freeWaitMinutes);
    const waitingPrice = parseFloat((billableMin * waitPricePerMin).toFixed(2));

    const updated = await OrderModel.updateOrderStatus(orderId, 'on_way', { waitingPrice });

    io.to(`order:${orderId}`).emit('order:on_way', {
        orderId, waitingSeconds: waitingSec, waitingPrice, order: updated,
    });

    smsService.sendByUserId(updated.user_id, `Ýola düşdüňiz. Garaşma bahasy: ${waitingPrice} TMT`)
        .catch((e) => console.error('sms order:on_way:', e));

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

    deductCommission(taxiId, orderId, totalPrice, order.payment_type)
        .catch((e) => console.error(`commission deduction failed for order ${orderId}:`, e));

    await redisClient.hSet(`taxi:${taxiId}:meta`, { status: 'free' });
    socket.data.activeOrderId = null;

    io.to(`order:${orderId}`).emit('order:completed', { orderId, totalPrice, order: updated });

    smsService.sendByUserId(order.user_id, `Sargyt tamamlandy. Jemi: ${totalPrice} TMT`)
        .catch((e) => console.error('sms order:completed:', e));

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

        // notify passenger that driver cancelled
        smsService.sendByUserId(order.user_id, 'Sürüji sargydy ýatyrdy. Täze taksi gözlenýär.')
            .catch((e) => console.error('sms order:cancelled by driver:', e));
    } else {
        // notify driver that passenger cancelled (if order was already accepted)
        if (order.taxi_id) {
            smsService.sendByTaxiId(order.taxi_id, 'Müşderi sargydy ýatyrdy.')
                .catch((e) => console.error('sms order:cancelled by user:', e));
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

// Client/driver sends a chat message tied to an order → persist + broadcast to the order room.
// Order chat is driver↔client only — admin talks to the user via the separate support chat
// (server/socket/supportSocket.js), never inside an order's thread.
async function handleChatSend(io, socket, data) {
    const { orderId, senderType, senderId, body } = data;

    if (!orderId || !senderType || !body) {
        return err(socket, 'orderId, senderType, body are required');
    }
    if (!['client', 'driver'].includes(senderType)) {
        return err(socket, "senderType must be 'client' or 'driver'");
    }

    const message = await MessageModel.addMessage({ orderId, senderType, senderId: senderId ?? null, body });

    io.to(`order:${orderId}`).emit('chat:message', message);
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
    wrap('chat:send',      handleChatSend);

    socket.on('order:watch', (data) => handleOrderWatch(socket, data));
}

module.exports = { initOrderSocket };
