import { http } from './http'

export async function fetchBookings() {
  const { data } = await http.get('/api/bookings')
  return data
}

export async function createBooking(payload) {
  const { data } = await http.post('/api/bookings', payload)
  return data
}

export async function updateBookingStatus(id, payload) {
  const { data } = await http.patch(`/api/bookings/${id}/status`, payload)
  return data
}

// ✅ Fix: DELETE endpoint — assignment requirement
export async function deleteBooking(id) {
  const { data } = await http.delete(`/api/bookings/${id}`)
  return data
}