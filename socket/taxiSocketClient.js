/**
 * taxiSocketClient.js
 * Copy this file to your mobile app and use with socket.io-client.
 *
 * Install:  npm install socket.io-client
 * Flutter:  use socket_io_client package (same event names)
 */

// ─── Event names ─────────────────────────────────────────────────────────────

export const EVENTS = {
    // emit  (client → server)
    REGISTER:          'register',
    TAXI_REGISTER:     'taxi:register',
    TAXI_LOCATION:     'taxi:location',
    TAXI_STATUS:       'taxi:status',
    CLIENT_WATCH:      'client:watch',
    CLIENT_UNWATCH:    'client:unwatch',
    CLIENT_WATCH_CITY: 'client:watch:city',
    CLIENT_UNWATCH_CITY: 'client:unwatch:city',
    CLIENT_GET_TAXIS:  'client:get:taxis',

    // on  (server → client)
    TAXI_REGISTERED:      'taxi:registered',
    TAXI_LOCATION_UPDATE: 'taxi:location:update',
    TAXI_STATUS_UPDATE:   'taxi:status:update',
    TAXI_STATUS_UPDATED:  'taxi:status:updated',
    CITY_TAXIS:           'city:taxis',
    TAXI_ERROR:           'taxi:error',
};

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * @param {string} serverUrl  e.g. 'http://192.168.1.10:3000'
 * @param {import('socket.io-client').Socket} socket  already connected socket instance
 */

// ─── Taxi driver helpers ──────────────────────────────────────────────────────

/**
 * Step 1: register user session (required before taxi:register)
 * @param {import('socket.io-client').Socket} socket
 * @param {{ phone: string, token?: string }} param
 */
export function registerUser(socket, { phone, token }) {
    socket.emit(EVENTS.REGISTER, { phone, token });
}

/**
 * Step 2: register taxi (sets taxiId + cityId on the session)
 * @param {import('socket.io-client').Socket} socket
 * @param {{ taxiId: number, cityId: number }} param
 * @returns {Promise<{ taxiId, cityId }>}
 */
export function registerTaxi(socket, { taxiId, cityId }) {
    return new Promise((resolve, reject) => {
        socket.once(EVENTS.TAXI_REGISTERED, resolve);
        socket.once(EVENTS.TAXI_ERROR,      reject);
        socket.emit(EVENTS.TAXI_REGISTER, { taxiId, cityId });
    });
}

/**
 * Send current GPS coordinates (call on location change)
 * @param {import('socket.io-client').Socket} socket
 * @param {{ lat: number, lng: number }} param
 */
export function sendLocation(socket, { lat, lng }) {
    socket.emit(EVENTS.TAXI_LOCATION, { lat, lng });
}

/**
 * Update taxi status
 * @param {import('socket.io-client').Socket} socket
 * @param {'free' | 'busy'} status
 * @returns {Promise<{ taxiId, status }>}
 */
export function setStatus(socket, status) {
    return new Promise((resolve, reject) => {
        socket.once(EVENTS.TAXI_STATUS_UPDATED, resolve);
        socket.once(EVENTS.TAXI_ERROR,          reject);
        socket.emit(EVENTS.TAXI_STATUS, { status });
    });
}

// ─── Passenger helpers ────────────────────────────────────────────────────────

/**
 * Watch a specific taxi (location + status updates)
 * @param {import('socket.io-client').Socket} socket
 * @param {number} taxiId
 */
export function watchTaxi(socket, taxiId) {
    socket.emit(EVENTS.CLIENT_WATCH, { taxiId });
}

/**
 * Stop watching a specific taxi
 * @param {import('socket.io-client').Socket} socket
 * @param {number} taxiId
 */
export function unwatchTaxi(socket, taxiId) {
    socket.emit(EVENTS.CLIENT_UNWATCH, { taxiId });
}

/**
 * Subscribe to all taxis in a city (map view)
 * @param {import('socket.io-client').Socket} socket
 * @param {number} cityId
 */
export function watchCity(socket, cityId) {
    socket.emit(EVENTS.CLIENT_WATCH_CITY, { cityId });
}

/**
 * Unsubscribe from city updates
 * @param {import('socket.io-client').Socket} socket
 * @param {number} cityId
 */
export function unwatchCity(socket, cityId) {
    socket.emit(EVENTS.CLIENT_UNWATCH_CITY, { cityId });
}

/**
 * Get snapshot of all taxis in a city (call once on map open)
 * @param {import('socket.io-client').Socket} socket
 * @param {number} cityId
 * @returns {Promise<{ cityId, taxis: Array<{ taxiId, lat, lng, status }> }>}
 */
export function getTaxis(socket, cityId) {
    return new Promise((resolve, reject) => {
        socket.once(EVENTS.CITY_TAXIS,  resolve);
        socket.once(EVENTS.TAXI_ERROR,  reject);
        socket.emit(EVENTS.CLIENT_GET_TAXIS, { cityId });
    });
}

// ─── Usage examples ───────────────────────────────────────────────────────────

/*
import { io } from 'socket.io-client';
import * as TaxiSocket from './taxiSocketClient';

const socket = io('http://YOUR_SERVER:3000');

// ── Taxi driver app ──
await TaxiSocket.registerTaxi(socket, { taxiId: 123, cityId: 1 });

navigator.geolocation.watchPosition(({ coords }) => {
    TaxiSocket.sendLocation(socket, { lat: coords.latitude, lng: coords.longitude });
});

await TaxiSocket.setStatus(socket, 'busy');  // принял заказ
await TaxiSocket.setStatus(socket, 'free');  // освободился

// ── Passenger app ──
// открыл карту
TaxiSocket.watchCity(socket, 1);
const { taxis } = await TaxiSocket.getTaxis(socket, 1); // начальные маркеры

socket.on(TaxiSocket.EVENTS.TAXI_LOCATION_UPDATE, ({ taxiId, lat, lng, status }) => {
    // обновить маркер taxiId на карте
});

socket.on(TaxiSocket.EVENTS.TAXI_STATUS_UPDATE, ({ taxiId, status }) => {
    // изменить цвет маркера: free=зелёный, busy=красный
});

// закрыл карту
TaxiSocket.unwatchCity(socket, 1);
*/
