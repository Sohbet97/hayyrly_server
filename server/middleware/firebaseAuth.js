const admin = require('../config/firebase');

async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: false, message: 'Token not provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.firebaseUser = decoded; // uid, phone_number, email, etc.
        next();
    } catch (error) {
        return res.status(401).json({ status: false, message: 'Invalid or expired token' });
    }
}

// Same as verifyFirebaseToken but does NOT block the request if no token
async function optionalFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.firebaseUser = null;
        return next();
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        req.firebaseUser = await admin.auth().verifyIdToken(idToken);
    } catch {
        req.firebaseUser = null;
    }

    next();
}

module.exports = { verifyFirebaseToken, optionalFirebaseToken };
