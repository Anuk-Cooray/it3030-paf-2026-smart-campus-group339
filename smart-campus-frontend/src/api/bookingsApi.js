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

export async function deleteBooking(id) {
  const { data } = await http.delete(`/api/bookings/${id}`)
  return data
}

// Feature 1: Heatmap
export async function fetchAvailability(resource, weekStart) {
  const { data } = await http.get('/api/bookings/availability', {
    params: { resource, weekStart }
  })
  return data
}

// Feature 4: Export CSV
export async function exportBookingsCsv(status = 'ALL') {
  const response = await http.get('/api/bookings/export/csv', {
    params: { status },
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `bookings-${status.toLowerCase()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}