import { api } from './client.js'

export function dailyReport(days) {
  return api.get('/analytics/daily', { days })
}

export function summaryReport(params) {
  return api.get('/reports/orders', params)
}
