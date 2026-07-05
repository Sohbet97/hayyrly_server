import { api } from './client.js'

export function listPricing() {
  return api.get('/pricing')
}

export function updatePricing(cityId, payload) {
  return api.put(`/pricing/${cityId}`, payload)
}
