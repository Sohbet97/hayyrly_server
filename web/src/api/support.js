import { api } from './client.js'

export function listSupportThreads(params) {
  return api.get('/support', params)
}

export function getSupportMessages(userId, params) {
  return api.get(`/support/${userId}/messages`, params)
}

export function replySupport(userId, { message, photoUrl }) {
  return api.post(`/support/${userId}/messages`, { message, photoUrl })
}
