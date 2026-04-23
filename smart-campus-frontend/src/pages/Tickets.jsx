import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { http } from '../api/http.js'

const EMPTY_FORM = {
  category: '',
  resourceLocation: '',
  description: '',
  priority: 'MEDIUM',
  contactDetails: '',
}

export default function Tickets() {
  const { token } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [attachments, setAttachments] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function loadMine() {
    setLoading(true)
    setError(null)
    try {
      const res = await http.get('/api/tickets', {
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
    loadMine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (files.length > 3) {
      setError('You can upload a maximum of 3 images.')
      return
    }
    const base64s = await Promise.all(
      files.map(
        (f) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(f)
          }),
      ),
    )
    setAttachments(base64s.filter((x) => typeof x === 'string'))
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    try {
      const payload = {
        category: form.category.trim(),
        resourceLocation: form.resourceLocation.trim(),
        description: form.description.trim(),
        priority: form.priority,
        contactDetails: form.contactDetails.trim(),
        imageAttachments: attachments,
      }
      const res = await http.post('/api/tickets', payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setItems((prev) => [res.data, ...prev])
      setForm(EMPTY_FORM)
      setAttachments([])
      setSuccess(true)
    } catch (e2) {
      setError(e2?.response?.data?.error || e2?.response?.data || e2?.message || String(e2))
    }
  }

  const cards = useMemo(() => items, [items])

  return (
    <div>
      <div style={card}>
        <h2 style={h2}>Report Maintenance / Incident Ticket</h2>
        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          <input
            required
            placeholder="Category (Electrical, Plumbing, Safety...)"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            style={input}
          />
          <input
            required
            placeholder="Resource Location"
            value={form.resourceLocation}
            onChange={(e) => setForm((p) => ({ ...p, resourceLocation: e.target.value }))}
            style={input}
          />
          <textarea
            required
            placeholder="Describe the issue..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            style={textarea}
          />
          <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} style={input}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
          <input
            required
            placeholder="Contact details"
            value={form.contactDetails}
            onChange={(e) => setForm((p) => ({ ...p, contactDetails: e.target.value }))}
            style={input}
          />
          <input type="file" multiple accept="image/*" onChange={handleFiles} />
          <div style={{ fontSize: 12, color: '#64748b' }}>Maximum 3 images. Selected: {attachments.length}</div>
          <button type="submit" style={primaryBtn}>
            Submit Ticket
          </button>
        </form>
        {error ? <div style={errorBox}>{String(error)}</div> : null}
        {success ? <div style={okBox}>Ticket created successfully.</div> : null}
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>My Tickets</h3>
        {loading ? <p style={p}>Loading...</p> : null}
        <div style={{ display: 'grid', gap: 10 }}>
          {cards.map((t) => (
            <div key={t.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong>{t.category}</strong>
                <span style={statusStyle(t.status)}>{t.status}</span>
              </div>
              <div style={{ color: '#334155', marginTop: 6 }}>{t.description}</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                {t.resourceLocation} · {t.priority} · {t.createdAt ? String(t.createdAt) : ''}
              </div>
            </div>
          ))}
          {!loading && cards.length === 0 ? <p style={p}>No tickets submitted yet.</p> : null}
        </div>
      </div>
    </div>
  )
}

const card = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 18,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}
const h2 = { margin: 0, marginBottom: 8, color: '#111827' }
const p = { margin: 0, color: '#4b5563', lineHeight: 1.5 }
const input = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, background: '#fff' }
const textarea = { ...input, minHeight: 95, resize: 'vertical' }
const primaryBtn = {
  border: 'none',
  borderRadius: 8,
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  padding: '9px 14px',
  cursor: 'pointer',
}
const errorBox = { marginTop: 10, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }
const okBox = { marginTop: 10, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 10, borderRadius: 8 }
function statusStyle(status) {
  if (status === 'OPEN') return { color: '#a16207', background: '#fffbeb', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }
  if (status === 'IN_PROGRESS') return { color: '#1d4ed8', background: '#eff6ff', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }
  if (status === 'RESOLVED' || status === 'CLOSED') return { color: '#047857', background: '#ecfdf5', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }
  return { color: '#be123c', background: '#fff1f2', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }
}
