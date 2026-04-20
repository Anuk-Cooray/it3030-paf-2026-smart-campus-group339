import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <div style={styles.kicker}>Dashboard</div>
          <h1 style={styles.title}>Welcome back, {user?.name || 'User'}!</h1>
        </div>
        <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.welcomeCard}>
        <p style={styles.meta}>
          <strong>Email:</strong> {user?.email}
        </p>
        <p style={styles.meta}>
          <strong>Access Level:</strong>
          <span style={styles.roleBadge}>
            {user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Standard User'}
          </span>
        </p>
      </div>

      <div style={styles.dashboardGrid}>
        <div style={styles.card}>
          <h3>Your Bookings</h3>
          <p>No active bookings found.</p>
        </div>
        <div style={styles.card}>
          <h3>Your Tickets</h3>
          <p>No open maintenance tickets.</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  kicker: { color: '#6b7280', fontWeight: 700, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { margin: 0, marginTop: 6, color: '#111827', fontSize: 28, lineHeight: 1.15 },
  meta: { margin: '0 0 10px 0', color: '#374151' },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: '30px',
  },
  roleBadge: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.85em',
    marginLeft: '10px',
  },
  dashboardGrid: { display: 'flex', gap: '20px' },
  card: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    flex: 1,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
}
