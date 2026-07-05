import { api } from './client.js'

export function dailyReport(params) {
  return api.get('/analytics/daily', params)
}

export function summaryReport(params) {
  return api.get('/reports/orders', params)
}

export function ordersByCity(params) {
  return api.get('/analytics/by-city', params)
}

export function cancellationSplit(params) {
  return api.get('/analytics/cancellations', params)
}

export function peakHours(params) {
  return api.get('/analytics/peak-hours', params)
}
