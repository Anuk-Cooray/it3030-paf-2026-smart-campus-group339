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
  background:
    'linear-gradient(128deg, rgba(8, 47, 73, 0.98) 0%, rgba(15, 23, 42, 0.97) 38%, rgba(30, 58, 138, 0.96) 72%, rgba(37, 99, 235, 0.95) 100%)',
  backgroundImage:
    'radial-gradient(circle at 12% 18%, rgba(125, 211, 252, 0.28) 0%, rgba(125, 211, 252, 0) 36%), radial-gradient(circle at 82% 78%, rgba(147, 197, 253, 0.22) 0%, rgba(147, 197, 253, 0) 40%), linear-gradient(128deg, rgba(8, 47, 73, 0.98) 0%, rgba(15, 23, 42, 0.97) 38%, rgba(30, 58, 138, 0.96) 72%, rgba(37, 99, 235, 0.95) 100%)',
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
  background: 'rgba(125, 211, 252, 0.34)',
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
  background: 'rgba(96, 165, 250, 0.32)',
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
  background: 'rgba(191, 219, 254, 0.22)',
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
