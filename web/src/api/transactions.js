import { api } from './client.js'

export function listTransactions(params) {
  return api.get('/transactions', params)
}
