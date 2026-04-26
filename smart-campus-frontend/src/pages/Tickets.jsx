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
        <div style={headerGlowOne} />
        <div style={headerGlowTwo} />
        <div style={headerGlowThree} />
        <div style={headerContent}>
          <h1 style={h1}>Maintenance Tickets</h1>
          <p style={headerP}>
            Report and track facility maintenance issues across campus locations
          </p>
        </div>
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
  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  backgroundImage:
    'radial-gradient(circle at 12% 18%, rgba(199, 210, 254, 0.3) 0%, rgba(199, 210, 254, 0) 36%), radial-gradient(circle at 82% 78%, rgba(221, 214, 254, 0.24) 0%, rgba(221, 214, 254, 0) 40%), linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  color: 'white',
  borderRadius: 16,
  padding: 40,
  marginBottom: 28,
  boxShadow: '0 16px 34px rgba(15, 23, 42, 0.42)',
  position: 'relative',
  overflow: 'hidden',
}

const headerContent = {
  position: 'relative',
  zIndex: 2,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const headerGlowOne = {
  position: 'absolute',
  width: 360,
  height: 360,
  borderRadius: '50%',
  top: -170,
  left: -80,
  background: 'rgba(199, 210, 254, 0.36)',
  filter: 'blur(64px)',
  zIndex: 0,
}

const headerGlowTwo = {
  position: 'absolute',
  width: 300,
  height: 300,
  borderRadius: '50%',
  bottom: -160,
  right: -30,
  background: 'rgba(196, 181, 253, 0.34)',
  filter: 'blur(58px)',
  zIndex: 0,
}

const headerGlowThree = {
  position: 'absolute',
  width: 240,
  height: 240,
  borderRadius: '50%',
  top: 40,
  right: 240,
  background: 'rgba(233, 213, 255, 0.25)',
  filter: 'blur(52px)',
  zIndex: 0,
}

const h1 = {
  margin: '0 0 12px 0',
  fontSize: 36,
  fontWeight: 800,
  letterSpacing: '-0.5px',
  position: 'relative',
  zIndex: 2,
  textAlign: 'center',
}

const headerP = {
  margin: 0,
  fontSize: 16,
  opacity: 0.95,
  lineHeight: 1.6,
  fontWeight: 500,
  position: 'relative',
  zIndex: 2,
  textAlign: 'center',
}
