import { api, setToken } from './client.js'

export async function login(phone, password) {
  const data = await api.post('/auth/login', { phone, password })
  setToken(data.token)
  return data.user
}

export async function me() {
  const data = await api.get('/auth/me')
  return data.user
}

export function logout() {
  setToken(null)
}
