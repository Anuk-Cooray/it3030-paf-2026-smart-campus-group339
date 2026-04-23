import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../AuthContext.jsx'
import { http } from '../../api/http.js'

const EMPTY_FORM = {
  name: '',
  type: '',
  capacity: '',
  location: '',
  availabilityWindows: '',
  status: 'ACTIVE',
}

export default function FacilitiesAdmin() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  async function loadFacilities() {
    setError(null)
    setLoading(true)
    try {
      const res = await http.get('/api/facilities', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadFacilities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const types = useMemo(
    () => ['ALL', ...Array.from(new Set(items.map((i) => i.type).filter(Boolean)))],
    [items],
  )
  const statuses = useMemo(
    () => ['ALL', ...Array.from(new Set(items.map((i) => i.status).filter(Boolean)))],
    [items],
  )

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

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      name: item.name || '',
      type: item.type || '',
      capacity: item.capacity ?? '',
      location: item.location || '',
      availabilityWindows: Array.isArray(item.availabilityWindows) ? item.availabilityWindows.join(', ') : '',
      status: item.status || 'ACTIVE',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setEditing(null)
  }

  async function saveFacility(e) {
    e.preventDefault()
    setError(null)
    const payload = {
      name: form.name.trim(),
      type: form.type.trim(),
      capacity: form.capacity === '' ? null : Number(form.capacity),
      location: form.location.trim(),
      availabilityWindows: form.availabilityWindows
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: form.status,
    }

    try {
      if (editing?.id) {
        const res = await http.put(`/api/facilities/${editing.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems((prev) => prev.map((i) => (i.id === editing.id ? res.data : i)))
      } else {
        const res = await http.post('/api/facilities', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems((prev) => [res.data, ...prev])
      }
      closeModal()
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.response?.data || e2?.message || String(e2))
    }
  }

  async function removeFacility(id) {
    setError(null)
    try {
      await http.delete(`/api/facilities/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a' }}>Facilities Administration</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Create, update, and manage campus resources.</p>
        </div>
        <button type="button" style={styles.primaryBtn} onClick={openCreate}>
          Create New Resource
        </button>
      </div>

      <div style={styles.filters}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, type, location"
          style={styles.input}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={styles.select}>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error ? <div style={styles.error}>{String(error)}</div> : null}
      {loading ? <div style={styles.meta}>Loading facilities...</div> : null}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Capacity</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Availability</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td style={styles.td}>{f.name}</td>
                <td style={styles.td}>{f.type}</td>
                <td style={styles.td}>{f.capacity ?? '-'}</td>
                <td style={styles.td}>{f.location || '-'}</td>
                <td style={styles.td}>{Array.isArray(f.availabilityWindows) ? f.availabilityWindows.join(', ') : '-'}</td>
                <td style={styles.td}>
                  <span style={f.status === 'ACTIVE' ? styles.statusActive : styles.statusOut}>{f.status || '-'}</span>
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
            {!loading && filtered.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={7}>
                  No facilities found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ marginTop: 0 }}>{editing ? 'Edit Facility' : 'Create Facility'}</h3>
            <form onSubmit={saveFacility} style={{ display: 'grid', gap: 10 }}>
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={styles.input}
              />
              <input
                required
                placeholder="Type (Lecture Hall, Lab, Equipment)"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                style={styles.input}
              />
              <input
                placeholder="Capacity"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                style={styles.input}
              />
              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                style={styles.input}
              />
              <input
                placeholder="Availability windows (comma separated)"
                value={form.availabilityWindows}
                onChange={(e) => setForm((p) => ({ ...p, availabilityWindows: e.target.value }))}
                style={styles.input}
              />
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                style={styles.select}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  {editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const styles = {
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  filters: { display: 'grid', gridTemplateColumns: '1fr 170px 170px', gap: 10, marginBottom: 12 },
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0', padding: 12 },
  td: { fontSize: 14, color: '#111827', borderBottom: '1px solid #f1f5f9', padding: 12, verticalAlign: 'top' },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  select: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, background: '#fff' },
  primaryBtn: {
    border: 'none',
    borderRadius: 8,
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    padding: '9px 14px',
    cursor: 'pointer',
  },
  cancelBtn: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#fff',
    color: '#334155',
    fontWeight: 600,
    padding: '9px 14px',
    cursor: 'pointer',
  },
  linkBtn: {
    border: '1px solid #bfdbfe',
    borderRadius: 7,
    background: '#eff6ff',
    color: '#1d4ed8',
    fontWeight: 600,
    padding: '6px 10px',
    marginRight: 8,
    cursor: 'pointer',
  },
  deleteBtn: {
    border: '1px solid #fecaca',
    borderRadius: 7,
    background: '#fef2f2',
    color: '#b91c1c',
    fontWeight: 600,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  statusActive: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 999,
    background: '#ecfdf5',
    color: '#047857',
    fontSize: 12,
    fontWeight: 700,
  },
  statusOut: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 999,
    background: '#fff1f2',
    color: '#be123c',
    fontSize: 12,
    fontWeight: 700,
  },
  error: { marginBottom: 10, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8 },
  meta: { color: '#64748b', marginBottom: 8 },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2,6,23,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalCard: { width: 'min(520px, 92vw)', background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' },
}
