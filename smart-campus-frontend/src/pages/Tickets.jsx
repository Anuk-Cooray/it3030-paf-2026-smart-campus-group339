import { useState } from 'react'
import TicketForm from '../components/tickets/TicketForm'
import TicketList from '../components/tickets/TicketList'

export default function Tickets() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTicketCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div style={pageContainer}>
      <div style={headerCard}>
        <h1 style={h1}>Maintenance Tickets</h1>
        <p style={headerP}>
          Report and track facility maintenance issues across campus locations
        </p>
      </div>

      <TicketForm onTicketCreated={handleTicketCreated} />
      <TicketList refreshTrigger={refreshTrigger} />
    </div>
  )
}

const pageContainer = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '16px',
}

const headerCard = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: 12,
  padding: 32,
  marginBottom: 24,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
}

const h1 = {
  margin: '0 0 8px 0',
  fontSize: 32,
  fontWeight: 700,
}

const headerP = {
  margin: 0,
  fontSize: 16,
  opacity: 0.9,
  lineHeight: 1.5,
}
