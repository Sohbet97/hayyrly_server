import { api } from './client.js'

export function listDrivers(params) {
  return api.get('/drivers', params)
}

export function adjustBalance(userId, payload) {
  return api.post(`/drivers/${userId}/balance`, payload)
}
