import { api } from './client.js'

export function listCities() {
  return api.get('/cities')
}

export function createCity(payload) {
  return api.post('/cities', payload)
}
