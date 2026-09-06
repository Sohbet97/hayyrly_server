import { api } from './client.js'

export function listMarkas() {
  return api.get('/cars/markas')
}
