const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const TOKEN_KEY = 'hayyrly_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${API_BASE}/api/admin${path}`, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    }
  }

  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    setToken(null)
    window.dispatchEvent(new Event('hayyrly:unauthorized'))
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.status === false) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }

  return data
}

export const api = {
  get:    (path, params)       => request(path, { method: 'GET', params }),
  post:   (path, body, params) => request(path, { method: 'POST', body, params }),
  put:    (path, body, params) => request(path, { method: 'PUT', body, params }),
  delete: (path, params)       => request(path, { method: 'DELETE', params }),
}
