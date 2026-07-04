import { api } from './client.js'

export function listApplications(params) {
  return api.get('/driver-applications', params)
}

export function approveApplication(id) {
  return api.put(`/driver-applications/${id}/approve`)
}

export function rejectApplication(id, reason) {
  return api.put(`/driver-applications/${id}/reject`, { reason })
}
