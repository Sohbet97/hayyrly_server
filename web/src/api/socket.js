import { io } from 'socket.io-client'
import { getToken } from './client.js'

// Same-origin in both dev (Vite proxy forwards /socket.io) and prod.
const SOCKET_BASE = import.meta.env.VITE_API_BASE || undefined

let socket = null
let adminRegistered = false

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_BASE, { transports: ['websocket', 'polling'] })
  }
  return socket
}

// Joins the admin:sos / admin:support realtime rooms (server/socket/sosSocket.js).
// Safe to call from multiple pages — only registers once per socket connection.
export function registerAdmin() {
  const s = getSocket()
  if (adminRegistered) return s
  adminRegistered = true
  const token = getToken()
  if (token) s.emit('admin:register', { token })
  s.on('connect', () => { if (token) s.emit('admin:register', { token }) })
  return s
}

export function watchCity(cityId) {
  getSocket().emit('client:watch:city', { cityId })
}

export function unwatchCity(cityId) {
  getSocket().emit('client:unwatch:city', { cityId })
}

export function requestCityTaxis(cityId) {
  getSocket().emit('client:get:taxis', { cityId })
}
