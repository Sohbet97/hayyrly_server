import { api } from './client.js'

export function listBalanceRequests(params) {
  return api.get('/balance-requests', params)
}

export function getBalanceRequest(id) {
  return api.get(`/balance-requests/${id}`)
}

export function confirmBalanceRequest(id) {
  return api.put(`/balance-requests/${id}/confirm`)
}

export function rejectBalanceRequest(id, reason) {
  return api.put(`/balance-requests/${id}/reject`, { reason })
}

export function sendBalanceRequestMessage(id, { message, photoUrl }) {
  return api.post(`/balance-requests/${id}/messages`, { message, photoUrl })
}
