import { NavLink, Outlet } from 'react-router-dom'
import { NotificationBell } from './NotificationBell.jsx'

const navLinkStyle = ({ isActive }) => ({
  display: 'block',
  padding: '10px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  color: isActive ? '#0b5fff' : '#1f2937',
  background: isActive ? '#e8f1ff' : 'transparent',
  fontWeight: isActive ? 700 : 600,
})

export default function Layout() {
  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>Smart Campus</div>
        <nav style={styles.sideNav}>
          <NavLink to="/app/dashboard" style={navLinkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/app/facilities" style={navLinkStyle}>
            Facilities
          </NavLink>
          <NavLink to="/app/bookings" style={navLinkStyle}>
            Bookings
          </NavLink>
          <NavLink to="/app/tickets" style={navLinkStyle}>
            Maintenance Tickets
          </NavLink>
          <NavLink to="/app/profile" style={navLinkStyle}>
            Profile
          </NavLink>
        </nav>
      </aside>

      <div style={styles.mainColumn}>
        <header style={styles.topbar}>
          <div style={styles.topbarTitle}>Operations Hub</div>
          <div style={styles.topbarRight}>
            <NotificationBell />
          </div>
        </header>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    background: '#f3f4f6',
  },
  sidebar: {
    borderRight: '1px solid #e5e7eb',
    background: '#ffffff',
    padding: 16,
  },
  brand: { fontSize: 16, fontWeight: 800, marginBottom: 16, color: '#111827' },
  sideNav: { display: 'grid', gap: 8 },
  mainColumn: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 18px',
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff',
  },
  topbarTitle: { fontWeight: 700, color: '#111827' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  content: { padding: 18, minWidth: 0 },
}
