import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../AuthContext.jsx'
import { http } from '../../api/http.js'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [facRes, bookingRes, ticketRes] = await Promise.all([
          http.get('/api/facilities', { headers }),
          http.get('/api/bookings', { headers }),
          http.get('/api/tickets', { headers }),
        ])
        if (!mounted) return
        setFacilities(Array.isArray(facRes.data) ? facRes.data : [])
        setBookings(Array.isArray(bookingRes.data) ? bookingRes.data : [])
        setTickets(Array.isArray(ticketRes.data) ? ticketRes.data : [])
      } catch (e) {
        if (!mounted) return
        setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [token])

  const stats = useMemo(() => {
    const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length
    const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
    const outOfServiceFacilities = facilities.filter((f) => f.status === 'OUT_OF_SERVICE').length
    return { pendingBookings, openTickets, outOfServiceFacilities }
  }, [facilities, bookings, tickets])

  const recentPendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'PENDING').slice(0, 5),
    [bookings],
  )
  const recentOpenTickets = useMemo(
    () => tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').slice(0, 5),
    [tickets],
  )

  return (
    <div>
      <div style={header}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Admin Dashboard</h2>
        <p style={sub}>Overview of facilities, bookings, and ticketing operations.</p>
      </div>

      {error ? <div style={errorBox}>{String(error)}</div> : null}
      {loading ? <div style={meta}>Loading dashboard metrics...</div> : null}

      <div style={statsGrid}>
        <StatCard title="Total Facilities" value={facilities.length} tone="blue" />
        <StatCard title="Pending Bookings" value={stats.pendingBookings} tone="amber" />
        <StatCard title="Open / In Progress Tickets" value={stats.openTickets} tone="rose" />
        <StatCard title="Out of Service Facilities" value={stats.outOfServiceFacilities} tone="slate" />
      </div>

      <div style={listsGrid}>
        <div style={card}>
          <h3 style={h3}>Pending Bookings</h3>
          {recentPendingBookings.length === 0 ? (
            <p style={p}>No pending bookings.</p>
          ) : (
            recentPendingBookings.map((b) => (
              <div key={b.id} style={row}>
                <strong>{b.resourceId}</strong>
                <span style={muted}>{b.userName || b.userId}</span>
              </div>
            ))
          )}
        </div>
        <div style={card}>
          <h3 style={h3}>Open Tickets</h3>
          {recentOpenTickets.length === 0 ? (
            <p style={p}>No open tickets.</p>
          ) : (
            recentOpenTickets.map((t) => (
              <div key={t.id} style={row}>
                <strong>{t.category || 'Ticket'}</strong>
                <span style={muted}>{t.resourceLocation || 'Unknown location'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, tone }) {
  const toneStyles = {
    blue: { border: '#bfdbfe', bg: '#eff6ff', fg: '#1d4ed8' },
    amber: { border: '#fde68a', bg: '#fffbeb', fg: '#a16207' },
    rose: { border: '#fecdd3', bg: '#fff1f2', fg: '#be123c' },
    slate: { border: '#cbd5e1', bg: '#f8fafc', fg: '#334155' },
  }
  const s = toneStyles[tone] || toneStyles.slate
  return (
    <div style={{ ...statCard, borderColor: s.border, background: s.bg }}>
      <div style={{ color: s.fg, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      <div style={{ color: '#0f172a', fontSize: 30, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  )
}

const header = { marginBottom: 14 }
const sub = { margin: '6px 0 0', color: '#64748b' }
const meta = { marginBottom: 10, color: '#64748b' }
const errorBox = {
  marginBottom: 10,
  color: '#b91c1c',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: 10,
  borderRadius: 8,
}
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 12 }
const statCard = { border: '1px solid', borderRadius: 12, padding: 14 }
const listsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const card = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}
const h3 = { margin: '0 0 10px', color: '#111827' }
const p = { margin: 0, color: '#4b5563', lineHeight: 1.5 }
const row = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }
const muted = { color: '#64748b', fontSize: 13 }
