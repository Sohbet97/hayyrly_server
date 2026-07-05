import { api } from './client.js'

export function listTeam() {
  return api.get('/team')
}

export function createTeamMember(payload) {
  return api.post('/team', payload)
}

export function updateTeamMember(id, payload) {
  return api.put(`/team/${id}`, payload)
}

export function removeTeamMember(id) {
  return api.delete(`/team/${id}`)
}
