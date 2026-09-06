import { api } from './client.js'

export function listSosAlerts(params) {
  return api.get('/sos', params)
}

export function updateSosAlertStatus(id, status) {
  return api.put(`/sos/${id}/status`, { status })
}
