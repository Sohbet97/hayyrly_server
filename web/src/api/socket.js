import { io } from 'socket.io-client'

// Same-origin in both dev (Vite proxy forwards /socket.io) and prod.
const SOCKET_BASE = import.meta.env.VITE_API_BASE || undefined

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_BASE, { transports: ['websocket', 'polling'] })
  }
  return socket
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
