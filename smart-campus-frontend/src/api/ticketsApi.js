import { http } from './http'

export async function fetchAllTickets() {
  const { data } = await http.get('/api/tickets')
  return data
}

export async function getTicketById(id) {
  const { data } = await http.get(`/api/tickets/${id}`)
  return data
}

export async function assignTechnician(ticketId, technicianName) {
  const { data } = await http.patch(`/api/tickets/${ticketId}/assign-technician`, {
    assignedTechnician: technicianName
  })
  return data
}

export async function updateTicketStatus(ticketId, status) {
  const { data } = await http.put(`/api/tickets/${ticketId}/status`, {
    status: status
  })
  return data
}

export async function rejectTicket(ticketId) {
  const { data } = await http.put(`/api/tickets/${ticketId}/status`, {
    status: 'REJECTED'
  })
  return data
}

export async function getTicketComments(ticketId) {
  const { data } = await http.get(`/api/tickets/${ticketId}/comments`)
  return data
}

export async function addTicketComment(ticketId, text) {
  const { data } = await http.post(`/api/tickets/${ticketId}/comments`, { text })
  return data
}

export async function deleteTicketComment(commentId) {
  await http.delete(`/api/comments/${commentId}`)
}
