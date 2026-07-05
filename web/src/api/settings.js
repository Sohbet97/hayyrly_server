import { api } from './client.js'

export function getSettings() {
  return api.get('/settings')
}

export function updateSettings(payload) {
  return api.put('/settings', payload)
}

export function getNotifPrefs() {
  return api.get('/settings/notifications')
}

export function updateNotifPrefs(payload) {
  return api.put('/settings/notifications', payload)
}
