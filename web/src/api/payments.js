import { api } from './client.js'

export function listPayments(params) {
  return api.get('/payments', params)
}

export function getPaymentsSummary(params) {
  return api.get('/payments/summary', params)
}

export function refundPayment(id, payload) {
  return api.post(`/payments/${id}/refund`, payload)
}

// Wallet ledger (driver balance top-ups/deductions) — already backed by a
// working endpoint, just never called from the web app before.
export function listWalletTransactions(params) {
  return api.get('/transactions', params)
}
