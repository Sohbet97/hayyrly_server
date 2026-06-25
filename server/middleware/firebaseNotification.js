const admin = require('../config/firebase');

// Send push notification to a single device
async function sendToDevice(fcmToken, title, body, data = {}) {
    const message = {
        notification: { title, body },
        data: stringifyValues(data),
        token: fcmToken,
    };
    return admin.messaging().send(message);
}

// Send to multiple devices at once (max 500 tokens)
async function sendToMultipleDevices(fcmTokens, title, body, data = {}) {
    const message = {
        notification: { title, body },
        data: stringifyValues(data),
        tokens: fcmTokens,
    };
    return admin.messaging().sendEachForMulticast(message);
}

// Send to a topic — all subscribers receive it (e.g. 'drivers', 'passengers')
async function sendToTopic(topic, title, body, data = {}) {
    const message = {
        notification: { title, body },
        data: stringifyValues(data),
        topic,
    };
    return admin.messaging().send(message);
}

// Subscribe a device token to a topic
async function subscribeToTopic(fcmToken, topic) {
    return admin.messaging().subscribeToTopic(fcmToken, topic);
}

// Unsubscribe a device token from a topic
async function unsubscribeFromTopic(fcmToken, topic) {
    return admin.messaging().unsubscribeFromTopic(fcmToken, topic);
}

// FCM data values must be strings
function stringifyValues(data) {
    return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
    );
}

module.exports = {
    sendToDevice,
    sendToMultipleDevices,
    sendToTopic,
    subscribeToTopic,
    unsubscribeFromTopic,
};
