import { http } from './http'

/**
 * Fetch a paginated list of facilities.
 * The backend returns a Spring Page object: { content: [], totalElements, totalPages, ... }
 * Query params: type, capacity, minCapacity, location, status, page, size
 */
export async function fetchFacilities(params = {}) {
  const { data } = await http.get('/api/facilities', { params })
  // Spring Page shape: data.content is the array
  return data
}

/**
 * Fetch a single facility by id.
 */
export async function fetchFacility(id) {
  const { data } = await http.get(`/api/facilities/${id}`)
  return data
}

/**
 * Create a new facility (ADMIN/STAFF only).
 * payload: { name, type, capacity, location, status, availabilityWindows: [{dayOfWeek, startTime, endTime}] }
 */
export async function createFacility(payload) {
  const { data } = await http.post('/api/facilities', payload)
  return data
}

/**
 * Update an existing facility (ADMIN/STAFF only).
 */
export async function updateFacility(id, payload) {
  const { data } = await http.put(`/api/facilities/${id}`, payload)
  return data
}

/**
 * Patch only the status of a facility (ADMIN/STAFF only).
 * status: 'ACTIVE' | 'OUT_OF_SERVICE'
 */
export async function updateFacilityStatus(id, status) {
  const { data } = await http.patch(`/api/facilities/${id}/status`, { status })
  return data
}

/**
 * Delete a facility (ADMIN/STAFF only).
 */
export async function deleteFacility(id) {
  await http.delete(`/api/facilities/${id}`)
}
