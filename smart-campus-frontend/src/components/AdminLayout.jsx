import { NavLink, Outlet } from 'react-router-dom'

const navLinkStyle = ({ isActive }) => ({
  display: 'block',
  padding: '10px 12px',
  borderRadius: 8,
  textDecoration: 'none',
  color: isActive ? '#93c5fd' : '#d1d5db',
  background: isActive ? '#1f2937' : 'transparent',
  fontWeight: isActive ? 700 : 600,
})

export default function AdminLayout() {
  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>Admin Console</div>
        <nav style={styles.sideNav}>
          <NavLink to="/admin/dashboard" style={navLinkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/facilities" style={navLinkStyle}>
            Facilities
          </NavLink>
          <NavLink to="/admin/bookings" style={navLinkStyle}>
            Bookings
          </NavLink>
          <NavLink to="/admin/tickets" style={navLinkStyle}>
            Tickets
          </NavLink>
        </nav>
      </aside>

      <div style={styles.mainColumn}>
        <header style={styles.topbar}>
          <div style={styles.topbarTitle}>Smart Campus Admin</div>
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
    background: '#0f172a',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  sidebar: {
    borderRight: '1px solid #1f2937',
    background: '#111827',
    padding: 16,
  },
  brand: { fontSize: 16, fontWeight: 800, marginBottom: 16, color: '#f9fafb' },
  sideNav: { display: 'grid', gap: 8 },
  mainColumn: { display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f1f5f9' },
  topbar: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 18px',
    borderBottom: '1px solid #dbe3ee',
    background: '#fff',
  },
  topbarTitle: { fontWeight: 700, color: '#0f172a' },
  content: { padding: 18, minWidth: 0 },
}

