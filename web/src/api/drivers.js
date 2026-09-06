import { api } from './client.js'

export function listDrivers(params) {
  return api.get('/drivers', params)
}

export function getDriver(userId) {
  return api.get(`/drivers/${userId}`)
}

export function getDriverOrders(userId, params) {
  return api.get(`/drivers/${userId}/orders`, params)
}

// Driver create/update take files (avatar/carImage) alongside the text fields in a
// single multipart request — FormData can't hold null, so nullish values are sent
// as '' and the backend treats an empty string as "not set" for optional fields.
function buildDriverFormData(payload, files = {}) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value === null || value === undefined ? '' : String(value))
  }
  if (files.avatar) formData.append('avatar', files.avatar)
  if (files.carImage) formData.append('carImage', files.carImage)
  return formData
}

export function createDriver(payload, files) {
  return api.upload('/drivers', buildDriverFormData(payload, files))
}

export function updateDriver(userId, payload, files) {
  return api.putForm(`/drivers/${userId}`, buildDriverFormData(payload, files))
}

export function adjustBalance(userId, payload) {
  return api.post(`/drivers/${userId}/balance`, payload)
}

export function setDriverActive(userId, isActive) {
  return api.put(`/drivers/${userId}/status`, { isActive })
}
