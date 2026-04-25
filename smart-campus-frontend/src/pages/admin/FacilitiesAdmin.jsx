import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../AuthContext'
import { fetchFacilities, createFacility, updateFacility, deleteFacility } from '../../api/facilitiesApi'

// ------------------------------------------------------------------
// Constants matching backend enums
// ------------------------------------------------------------------
const FACILITY_TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'PROJECTOR', 'CAMERA', 'OTHER']
const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const EMPTY_WINDOW = { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00' }

const EMPTY_FORM = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: '',
  location: '',
  status: 'ACTIVE',
  availabilityWindows: [{ ...EMPTY_WINDOW }],
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const DAY_LABELS = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

function fmtWindow(w) {
  if (!w) return ''
  const day = DAY_LABELS[w.dayOfWeek] || w.dayOfWeek
  const clip = (t) => (t ? t.slice(0, 5) : '')
  return `${day} ${clip(w.startTime)}–${clip(w.endTime)}`
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function FacilitiesAdmin() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // ----------------------------------------------------------------
  // Load
  // ----------------------------------------------------------------
  async function loadFacilities() {
    setError(null)
    setLoading(true)
    try {
      const page = await fetchFacilities({ size: 200 })
      // Spring Page: { content: [...], totalElements, totalPages, ... }
      const content = Array.isArray(page?.content) ? page.content : []
      setItems(content)
      setTotalElements(page?.totalElements ?? content.length)
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data || e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return   // wait for auth
    loadFacilities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // ----------------------------------------------------------------
  // Client-side filter (we already fetched all with size=200)
  // ----------------------------------------------------------------
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        !query ||
        [item.name, item.type, item.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      return matchesQuery && matchesType && matchesStatus
    })
  }, [items, query, typeFilter, statusFilter])

  // ----------------------------------------------------------------
  // Modal helpers
  // ----------------------------------------------------------------
  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      name: item.name || '',
      type: item.type || 'LECTURE_HALL',
      capacity: item.capacity ?? '',
      location: item.location || '',
      status: item.status || 'ACTIVE',
      availabilityWindows:
        Array.isArray(item.availabilityWindows) && item.availabilityWindows.length > 0
          ? item.availabilityWindows.map((w) => ({
              dayOfWeek: w.dayOfWeek,
              startTime: w.startTime ? w.startTime.slice(0, 5) : '08:00',
              endTime: w.endTime ? w.endTime.slice(0, 5) : '17:00',
            }))
          : [{ ...EMPTY_WINDOW }],
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setEditing(null)
    setError(null)
  }

  // ----------------------------------------------------------------
  // Availability window row management
  // ----------------------------------------------------------------
  function addWindow() {
    setForm((p) => ({ ...p, availabilityWindows: [...p.availabilityWindows, { ...EMPTY_WINDOW }] }))
  }

  function removeWindow(idx) {
    setForm((p) => ({
      ...p,
      availabilityWindows: p.availabilityWindows.filter((_, i) => i !== idx),
    }))
  }

  function updateWindow(idx, field, value) {
    setForm((p) => {
      const wins = [...p.availabilityWindows]
      wins[idx] = { ...wins[idx], [field]: value }
      return { ...p, availabilityWindows: wins }
    })
  }

  // ----------------------------------------------------------------
  // Save (create / update)
  // ----------------------------------------------------------------
  async function saveFacility(e) {
    e.preventDefault()
    setError(null)

    // Validate windows
    for (const w of form.availabilityWindows) {
      if (!w.startTime || !w.endTime) {
        setError('All availability windows must have a start and end time.')
        return
      }
      if (w.startTime >= w.endTime) {
        setError('Start time must be before end time in every availability window.')
        return
      }
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: form.capacity === '' ? null : Number(form.capacity),
      location: form.location.trim(),
      status: form.status,
      availabilityWindows: form.availabilityWindows.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime + ':00', // backend LocalTime needs seconds
        endTime: w.endTime + ':00',
      })),
    }

    setSaving(true)
    try {
      if (editing?.id) {
        const updated = await updateFacility(editing.id, payload)
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)))
      } else {
        const created = await createFacility(payload)
        setItems((prev) => [created, ...prev])
      }
      closeModal()
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.response?.data || e2?.message || String(e2))
    } finally {
      setSaving(false)
    }
  }

  // ----------------------------------------------------------------
  // Delete
  // ----------------------------------------------------------------
  async function removeFacility(id) {
    if (!window.confirm('Delete this facility? This cannot be undone.')) return
    setError(null)
    try {
      await deleteFacility(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data || e?.message || String(e))
    }
  }

  // ================================================================
  // Render
  // ================================================================
  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>Facilities Administration</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>
            Create, update, and manage campus resources.
            {totalElements > 0 && <span style={{ marginLeft: 8 }}>({totalElements} total)</span>}
          </p>
        </div>
        <button id="create-facility-btn" type="button" style={styles.primaryBtn} onClick={openCreate}>
          + Create New Resource
        </button>
      </div>

      <div style={styles.filters}>
        <input
          id="facility-admin-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, type, location"
          style={styles.input}
        />
        <select id="facility-admin-type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={styles.select}>
          <option value="ALL">All Types</option>
          {FACILITY_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select id="facility-admin-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
        </select>
      </div>

      {error && <div style={styles.error}>{String(error)}</div>}
      {loading && <div style={styles.meta}>Loading facilities…</div>}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Capacity</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Availability Windows</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td style={styles.td}><strong>{f.name}</strong></td>
                <td style={styles.td}>{f.type?.replace(/_/g, ' ') || '-'}</td>
                <td style={styles.td}>{f.capacity ?? '-'}</td>
                <td style={styles.td}>{f.location || '-'}</td>
                <td style={styles.td}>
                  {Array.isArray(f.availabilityWindows) && f.availabilityWindows.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {f.availabilityWindows.map((w, i) => (
                        <span key={i} style={styles.chip}>{fmtWindow(w)}</span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td style={styles.td}>
                  <span style={f.status === 'ACTIVE' ? styles.statusActive : styles.statusOut}>
                    {f.status || '-'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button type="button" style={styles.linkBtn} onClick={() => openEdit(f)}>
                    Edit
                  </button>
                  <button type="button" style={styles.deleteBtn} onClick={() => removeFacility(f.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={7}>No facilities found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Modal ---- */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>{editing ? 'Edit Facility' : 'Create Facility'}</h3>
            <form onSubmit={saveFacility} style={{ display: 'grid', gap: 12 }}>

              <label style={styles.label}>Name *</label>
              <input
                required
                id="facility-form-name"
                placeholder="e.g. Lecture Hall A"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={styles.input}
              />

              <label style={styles.label}>Type *</label>
              <select
                id="facility-form-type"
                required
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                style={styles.select}
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>

              <label style={styles.label}>Capacity *</label>
              <input
                required
                id="facility-form-capacity"
                type="number"
                min="1"
                placeholder="e.g. 30"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                style={styles.input}
              />

              <label style={styles.label}>Location *</label>
              <input
                required
                id="facility-form-location"
                placeholder="e.g. Block A, Floor 2"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                style={styles.input}
              />

              <label style={styles.label}>Status</label>
              <select
                id="facility-form-status"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                style={styles.select}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>

              {/* Availability Windows */}
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...styles.label, margin: 0 }}>Availability Windows *</label>
                  <button type="button" onClick={addWindow} style={styles.addWindowBtn}>
                    + Add Window
                  </button>
                </div>
                {form.availabilityWindows.map((w, i) => (
                  <div key={i} style={styles.windowRow}>
                    <select
                      value={w.dayOfWeek}
                      onChange={(e) => updateWindow(i, 'dayOfWeek', e.target.value)}
                      style={{ ...styles.select, flex: 1 }}
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>{DAY_LABELS[d]}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={w.startTime}
                      onChange={(e) => updateWindow(i, 'startTime', e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                      required
                    />
                    <span style={{ alignSelf: 'center', color: '#64748b' }}>–</span>
                    <input
                      type="time"
                      value={w.endTime}
                      onChange={(e) => updateWindow(i, 'endTime', e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                      required
                    />
                    {form.availabilityWindows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWindow(i)}
                        style={styles.removeWindowBtn}
                        title="Remove window"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {error && <div style={styles.error}>{String(error)}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" id="facility-form-submit" style={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ================================================================
// Styles
// ================================================================
const styles = {
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  filters: { display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: 10, marginBottom: 12 },
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0', padding: 12, fontWeight: 700 },
  td: { fontSize: 14, color: '#111827', borderBottom: '1px solid #f1f5f9', padding: 12, verticalAlign: 'top' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  select: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, background: '#fff', width: '100%', boxSizing: 'border-box' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 2 },
  primaryBtn: {
    border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff',
    fontWeight: 700, padding: '9px 16px', cursor: 'pointer', fontSize: 14,
  },
  cancelBtn: {
    border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#334155',
    fontWeight: 600, padding: '9px 14px', cursor: 'pointer', fontSize: 14,
  },
  linkBtn: {
    border: '1px solid #bfdbfe', borderRadius: 7, background: '#eff6ff', color: '#1d4ed8',
    fontWeight: 600, padding: '6px 10px', marginRight: 8, cursor: 'pointer', fontSize: 13,
  },
  deleteBtn: {
    border: '1px solid #fecaca', borderRadius: 7, background: '#fef2f2', color: '#b91c1c',
    fontWeight: 600, padding: '6px 10px', cursor: 'pointer', fontSize: 13,
  },
  addWindowBtn: {
    border: '1px solid #bfdbfe', borderRadius: 7, background: '#eff6ff', color: '#1d4ed8',
    fontWeight: 600, padding: '5px 10px', cursor: 'pointer', fontSize: 13,
  },
  removeWindowBtn: {
    border: '1px solid #fecaca', borderRadius: 7, background: '#fef2f2', color: '#b91c1c',
    fontWeight: 700, padding: '5px 10px', cursor: 'pointer', fontSize: 16, lineHeight: 1,
  },
  windowRow: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  chip: {
    display: 'inline-block', background: '#f0f9ff', border: '1px solid #bae6fd',
    color: '#0369a1', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600,
  },
  statusActive: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 999,
    background: '#ecfdf5', color: '#047857', fontSize: 12, fontWeight: 700,
  },
  statusOut: {
    display: 'inline-block', padding: '3px 8px', borderRadius: 999,
    background: '#fff1f2', color: '#be123c', fontSize: 12, fontWeight: 700,
  },
  error: {
    marginBottom: 10, color: '#b91c1c', background: '#fef2f2',
    border: '1px solid #fecaca', padding: 10, borderRadius: 8, fontSize: 13,
  },
  meta: { color: '#64748b', marginBottom: 8, fontSize: 14 },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modalCard: {
    width: 'min(560px, 94vw)', background: '#fff', borderRadius: 14,
    padding: '24px 20px', border: '1px solid #e2e8f0',
    maxHeight: '90vh', overflowY: 'auto',
  },
}
