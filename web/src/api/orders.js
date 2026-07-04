import { api } from './client.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function listOrders(params) {
  return api.get('/orders', params)
}

// Reuses the existing (mobile-facing) PATCH /api/orders/:id/status endpoint —
// the admin module doesn't duplicate order-mutation logic.
export async function updateOrderStatus(id, status) {
  const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.status === false) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}
