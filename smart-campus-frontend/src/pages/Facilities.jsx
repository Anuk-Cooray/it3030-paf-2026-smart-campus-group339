import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { fetchFacilities } from '../api/facilitiesApi'

const FACILITY_TYPES = ['ALL', 'LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'PROJECTOR', 'CAMERA', 'OTHER']
const DAY_LABELS = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

function formatWindow(w) {
  if (!w) return ''
  const day = DAY_LABELS[w.dayOfWeek] || w.dayOfWeek
  const fmt = (t) => {
    if (!t) return ''
    // t may be "HH:MM:SS" or "HH:MM"
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const display = hour % 12 || 12
    return `${display}:${m}${suffix}`
  }
  return `${day} ${fmt(w.startTime)}–${fmt(w.endTime)}`
}

export default function Facilities() {
  const { token } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filter state
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    if (!token) return          // wait until authenticated
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchFacilities({ size: 100 })
      .then((page) => {
        if (!cancelled) setFacilities(page?.content ?? [])
      })
      .catch((err) => {
        if (!cancelled)
          setError(err?.response?.data?.message || err?.message || 'Failed to load facilities.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])  // re-fetch whenever auth token changes

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        [f.name, f.type, f.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesType = typeFilter === 'ALL' || f.type === typeFilter
      const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter
      return matchesQuery && matchesType && matchesStatus
    })
  }, [facilities, query, typeFilter, statusFilter])

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Campus Facilities</h1>
          <p style={s.subtitle}>Browse available rooms, labs, and equipment across campus.</p>
        </div>
        <div style={s.statsRow}>
          <div style={s.statBox}>
            <span style={s.statNum}>{facilities.filter(f => f.status === 'ACTIVE').length}</span>
            <span style={s.statLabel}>Available</span>
          </div>
          <div style={s.statBox}>
            <span style={s.statNum}>{facilities.length}</span>
            <span style={s.statLabel}>Total</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterBar}>
        <input
          id="facility-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍  Search by name, type or location…"
          style={s.searchInput}
        />
        <select id="facility-type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={s.select}>
          {FACILITY_TYPES.map((t) => (
            <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select id="facility-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.select}>
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={s.errorBanner}>
          <span>⚠️ {error}</span>
          <button style={s.closeBtn} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={s.emptyState}>
          <div style={s.spinner} />
          <p style={{ marginTop: 16, color: '#6b7280' }}>Loading facilities…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
          <p style={{ color: '#9ca3af', fontSize: 16 }}>No facilities match your search.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map((f) => (
            <FacilityCard key={f.id} facility={f} />
          ))}
        </div>
      )}
    </div>
  )
}

function FacilityCard({ facility: f }) {
  const isActive = f.status === 'ACTIVE'
  const typeIcon = {
    LECTURE_HALL: '🏛️', LAB: '🔬', MEETING_ROOM: '🤝',
    PROJECTOR: '📽️', CAMERA: '📷', OTHER: '📦',
  }[f.type] || '🏢'

  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={s.iconCircle}>{typeIcon}</div>
        <span style={isActive ? s.badgeActive : s.badgeOut}>
          {isActive ? '● Active' : '● Out of Service'}
        </span>
      </div>

      <h3 style={s.cardName}>{f.name}</h3>
      <p style={s.cardType}>{f.type?.replace(/_/g, ' ')}</p>

      <div style={s.metaGrid}>
        {f.location && (
          <div style={s.metaItem}>
            <span style={s.metaIcon}>📍</span>
            <span style={s.metaText}>{f.location}</span>
          </div>
        )}
        {f.capacity != null && (
          <div style={s.metaItem}>
            <span style={s.metaIcon}>👥</span>
            <span style={s.metaText}>Capacity: {f.capacity}</span>
          </div>
        )}
      </div>

      {Array.isArray(f.availabilityWindows) && f.availabilityWindows.length > 0 && (
        <div style={s.windowsWrap}>
          <p style={s.windowsLabel}>Availability</p>
          <div style={s.windowsList}>
            {f.availabilityWindows.map((w, i) => (
              <span key={i} style={s.windowChip}>{formatWindow(w)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 18px',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    background: 'linear-gradient(135deg, #1e40af 0%, #4f46e5 100%)',
    borderRadius: 20,
    padding: '32px 36px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    boxShadow: '0 10px 30px -8px rgba(79,70,229,0.45)',
  },
  title: { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' },
  subtitle: { margin: '6px 0 0', fontSize: 15, opacity: 0.85 },
  statsRow: { display: 'flex', gap: 16 },
  statBox: {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    borderRadius: 14,
    padding: '14px 22px',
    textAlign: 'center',
  },
  statNum: { display: 'block', fontSize: 26, fontWeight: 800 },
  statLabel: { display: 'block', fontSize: 12, opacity: 0.8, marginTop: 2 },

  filterBar: {
    display: 'grid',
    gridTemplateColumns: '1fr 200px 200px',
    gap: 12,
  },
  searchInput: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    fontSize: 15,
    background: '#fff',
    outline: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  select: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    fontSize: 15,
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },

  errorBanner: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    borderRadius: 12,
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none', border: 'none', color: '#b91c1c',
    fontSize: 22, cursor: 'pointer', padding: '0 4px',
  },

  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 20px',
    background: '#f9fafb', borderRadius: 20, border: '2px dashed #e5e7eb',
  },
  spinner: {
    width: 40, height: 40, border: '4px solid #e5e7eb',
    borderTop: '4px solid #4f46e5', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },

  card: {
    background: '#fff',
    borderRadius: 18,
    padding: 24,
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 20px -8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: 'box-shadow 0.2s',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 14,
    background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24,
  },
  badgeActive: {
    fontSize: 12, fontWeight: 700, color: '#065f46',
    background: '#d1fae5', borderRadius: 999, padding: '4px 10px',
  },
  badgeOut: {
    fontSize: 12, fontWeight: 700, color: '#9f1239',
    background: '#ffe4e6', borderRadius: 999, padding: '4px 10px',
  },
  cardName: { margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' },
  cardType: { margin: 0, fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },

  metaGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 8 },
  metaIcon: { fontSize: 15, width: 20, textAlign: 'center' },
  metaText: { fontSize: 14, color: '#374151' },

  windowsWrap: { borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 },
  windowsLabel: { margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  windowsList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  windowChip: {
    background: '#f0f9ff', border: '1px solid #bae6fd',
    color: '#0369a1', borderRadius: 8, padding: '4px 10px',
    fontSize: 12, fontWeight: 600,
  },
}
