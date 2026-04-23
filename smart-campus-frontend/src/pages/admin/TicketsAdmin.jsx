import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext.jsx'
import { http } from '../../api/http.js'

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']

export default function TicketsAdmin() {
  const { token, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [statusDraft, setStatusDraft] = useState('OPEN')
  const [assignedTech, setAssignedTech] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  async function loadTickets() {
    setLoading(true)
    setError(null)
    try {
      const res = await http.get('/api/tickets', { headers: { Authorization: `Bearer ${token}` } })
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function openTicket(t) {
    setSelected(t)
    setStatusDraft(t.status || 'OPEN')
    setAssignedTech(t.assignedTech || '')
    setResolutionNotes(t.resolutionNotes || '')
    setCommentText('')
    try {
      const res = await http.get(`/api/tickets/${t.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setComments(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setComments([])
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  useEffect(() => {
    if (!token) return
    loadTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function saveStatus() {
    if (!selected?.id) return
    setError(null)
    try {
      const res = await http.patch(
        `/api/tickets/${selected.id}/status`,
        {
          status: statusDraft,
          assignedTech,
          resolutionNotes,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const updated = res.data
      setSelected(updated)
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  async function addComment() {
    if (!selected?.id || !commentText.trim()) return
    setError(null)
    try {
      const res = await http.post(
        `/api/tickets/${selected.id}/comments`,
        { text: commentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setComments((prev) => [...prev, res.data])
      setCommentText('')
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  async function deleteComment(commentId) {
    setError(null)
    try {
      await http.delete(`/api/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } })
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 10px', color: '#0f172a' }}>Ticket Helpdesk (Admin)</h2>
      {error ? <div style={styles.error}>{String(error)}</div> : null}
      {loading ? <div style={styles.meta}>Loading tickets...</div> : null}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} onClick={() => openTicket(t)} style={{ cursor: 'pointer' }}>
                <td style={styles.td}>{t.category}</td>
                <td style={styles.td}>{t.resourceLocation}</td>
                <td style={styles.td}>{t.userName || t.userId}</td>
                <td style={styles.td}>{t.priority}</td>
                <td style={styles.td}>{t.status}</td>
                <td style={styles.td}>{t.createdAt ? String(t.createdAt) : '-'}</td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={6}>
                  No tickets found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Ticket Details</h3>
              <button type="button" style={styles.cancelBtn} onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <div style={styles.panelGrid}>
              <div>
                <p style={styles.muted}>
                  <strong>Category:</strong> {selected.category}
                </p>
                <p style={styles.muted}>
                  <strong>Location:</strong> {selected.resourceLocation}
                </p>
                <p style={styles.muted}>
                  <strong>Description:</strong> {selected.description}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(selected.imageAttachments || []).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Attachment ${idx + 1}`}
                      style={{ width: 130, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  ))}
                  {(selected.imageAttachments || []).length === 0 ? <p style={styles.muted}>No attachments.</p> : null}
                </div>
              </div>
              <div>
                <h4 style={{ marginTop: 0 }}>Comments</h4>
                <div style={styles.commentBox}>
                  {comments.map((c) => {
                    const canDelete =
                      c.userId === user?.userId ||
                      user?.role === 'ROLE_ADMIN' ||
                      user?.role === 'ADMIN'
                    return (
                      <div key={c.id} style={styles.commentItem}>
                        <div style={{ fontSize: 13, color: '#334155' }}>
                          <strong>{c.userName || c.userId}</strong> · {c.createdAt ? String(c.createdAt) : ''}
                        </div>
                        <div style={{ marginTop: 4, color: '#111827' }}>{c.text}</div>
                        {canDelete ? (
                          <button type="button" style={styles.deleteBtn} onClick={() => deleteComment(c.id)}>
                            Delete
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                  {comments.length === 0 ? <div style={styles.muted}>No comments yet.</div> : null}
                </div>
                <textarea
                  rows={3}
                  style={styles.textarea}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="button" style={styles.primaryBtn} onClick={addComment}>
                  Add Comment
                </button>

                <hr style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />
                <h4 style={{ marginTop: 0 }}>Admin Controls</h4>
                <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} style={styles.input}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  style={styles.input}
                  placeholder="Assign Technician"
                  value={assignedTech}
                  onChange={(e) => setAssignedTech(e.target.value)}
                />
                <textarea
                  rows={3}
                  style={styles.textarea}
                  placeholder="Resolution notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
                <button type="button" style={styles.primaryBtn} onClick={saveStatus}>
                  Save Ticket Update
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const styles = {
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0', padding: 12 },
  td: { fontSize: 14, color: '#111827', borderBottom: '1px solid #f1f5f9', padding: 12, verticalAlign: 'top' },
  meta: { color: '#64748b', marginBottom: 8 },
  error: { marginBottom: 10, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 8 },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2,6,23,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  },
  modalCard: {
    width: 'min(1100px, 95vw)',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #e2e8f0',
  },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 },
  muted: { color: '#475569', lineHeight: 1.45 },
  commentBox: {
    maxHeight: 220,
    overflow: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    background: '#f8fafc',
  },
  commentItem: { borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 8 },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, marginBottom: 8 },
  textarea: { width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, marginBottom: 8, resize: 'vertical' },
  primaryBtn: { border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', fontWeight: 700, padding: '8px 13px', cursor: 'pointer' },
  cancelBtn: { border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#334155', fontWeight: 600, padding: '7px 12px', cursor: 'pointer' },
  deleteBtn: { marginTop: 6, border: '1px solid #fecaca', borderRadius: 7, background: '#fef2f2', color: '#b91c1c', fontWeight: 600, padding: '5px 9px', cursor: 'pointer' },
}
