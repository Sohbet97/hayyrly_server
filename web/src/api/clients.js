import { api } from './client.js'

export function listClients(params) {
  return api.get('/clients', params)
}

export function getClientOrders(userId, params) {
  return api.get(`/clients/${userId}/orders`, params)
}

export function setClientBlocked(userId, isBlocked, reason) {
  return api.put(`/clients/${userId}/status`, { isBlocked, reason })
}
