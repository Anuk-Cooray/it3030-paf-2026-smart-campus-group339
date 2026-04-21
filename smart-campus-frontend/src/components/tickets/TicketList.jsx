import { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext'

export default function TicketList({ refreshTrigger }) {
  const { authToken } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchTickets = async () => {
    if (!authToken) return

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8080/api/tickets', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }

      const data = await response.json()
      setTickets(data)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [refreshTrigger, authToken])

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#991b1b',
    }
    return colors[priority?.toLowerCase()] || '#6b7280'
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Maintenance Tickets</h3>

      {message && (
        <div style={{
          ...styles.alert,
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
        }}>
          {message.text}
        </div>
      )}

      {loading && <div style={styles.loading}>Loading tickets...</div>}

      {!loading && tickets.length === 0 && (
        <div style={styles.empty}>No tickets found</div>
      )}

      {!loading && tickets.length > 0 && (
        <div style={styles.grid}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h4 style={styles.cardTitle}>{ticket.resource}</h4>
                  <p style={styles.cardLocation}>📍 {ticket.location}</p>
                </div>
                <div style={{
                  ...styles.priorityBadge,
                  backgroundColor: getPriorityColor(ticket.priority),
                }}>
                  {ticket.priority?.toUpperCase() || 'N/A'}
                </div>
              </div>

              <p style={styles.description}>{ticket.description}</p>

              <div style={styles.meta}>
                <span style={styles.category}>{ticket.category}</span>
                <span style={styles.status}>{ticket.status}</span>
              </div>

              <div style={styles.footer}>
                <small style={styles.footerText}>
                  By: <strong>{ticket.userName}</strong>
                </small>
                {ticket.contactDetails && (
                  <>
                    <br />
                    <small style={styles.footerText}>
                      Contact: <strong>{ticket.contactDetails}</strong>
                    </small>
                  </>
                )}
                <br />
                <small style={styles.footerText}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 24,
  },
  title: {
    margin: '0 0 16px 0',
    color: '#111827',
    fontSize: 18,
    fontWeight: 600,
  },
  alert: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  loading: {
    padding: 32,
    textAlign: 'center',
    color: '#6b7280',
  },
  empty: {
    padding: 32,
    textAlign: 'center',
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  cardTitle: {
    margin: '0 0 4px 0',
    color: '#111827',
    fontSize: 16,
    fontWeight: 600,
  },
  cardLocation: {
    margin: '0 0 8px 0',
    color: '#6b7280',
    fontSize: 13,
  },
  priorityBadge: {
    color: 'white',
    padding: '6px 12px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  description: {
    margin: '0 0 12px 0',
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 1.5,
  },
  meta: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  category: {
    background: '#3b82f6',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 12,
  },
  status: {
    background: '#dbeafe',
    color: '#0c4a6e',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 12,
  },
  footer: {
    paddingTop: 12,
    borderTop: '1px solid #e5e7eb',
    fontSize: 12,
  },
  footerText: {
    color: '#6b7280',
  },
}
