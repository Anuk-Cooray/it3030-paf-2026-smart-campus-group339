import { http } from './http'

export async function listFacilities(params) {
  const { data } = await http.get('/facilities', { params })
  return data
}

export async function createFacility(payload) {
  const { data } = await http.post('/facilities', payload)
  return data
}

export async function updateFacility(id, payload) {
  const { data } = await http.put(`/facilities/${id}`, payload)
  return data
}

export async function updateFacilityStatus(id, status) {
  const { data } = await http.patch(`/facilities/${id}/status`, { status })
  return data
}

export async function deleteFacility(id) {
  await http.delete(`/facilities/${id}`)
}