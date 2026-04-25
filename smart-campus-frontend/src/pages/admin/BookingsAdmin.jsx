import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../AuthContext.jsx'
import { http } from '../../api/http.js'

export default function BookingsAdmin() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rejectModal, setRejectModal] = useState({ open: false, id: null })
  const [rejectionReason, setRejectionReason] = useState('')

  async function loadBookings() {
    setLoading(true)
    setError(null)
    try {
      const params = statusFilter === 'ALL' ? {} : { status: statusFilter }
      const res = await http.get('/api/bookings', {
        params,
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
    loadBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter])

  async function approve(id) {
    setError(null)
    try {
      const res = await http.patch(
        `/api/bookings/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setItems((prev) => prev.map((b) => (b.id === id ? res.data : b)))
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  function openRejectModal(id) {
    setRejectModal({ open: true, id })
    setRejectionReason('')
  }

  function closeRejectModal() {
    setRejectModal({ open: false, id: null })
    setRejectionReason('')
  }

  async function reject() {
    if (!rejectModal.id) return
    setError(null)
    try {
      const res = await http.patch(
        `/api/bookings/${rejectModal.id}/reject`,
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setItems((prev) => prev.map((b) => (b.id === rejectModal.id ? res.data : b)))
      closeRejectModal()
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  const rows = useMemo(() => items, [items])

  return (
    <div>
      <div style={styles.topBar}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Booking Management</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error ? <div style={styles.error}>{String(error)}</div> : null}
      {loading ? <div style={styles.meta}>Loading bookings...</div> : null}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Resource</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Start</th>
              <th style={styles.th}>End</th>
              <th style={styles.th}>Purpose</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td style={styles.td}>{b.resourceId}</td>
                <td style={styles.td}>{b.userName || b.userId}</td>
                <td style={styles.td}>{b.startTime ? String(b.startTime) : '-'}</td>
                <td style={styles.td}>{b.endTime ? String(b.endTime) : '-'}</td>
                <td style={styles.td}>{b.purpose || '-'}</td>
                <td style={styles.td}>
                  <span
                    style={
                      b.status === 'PENDING'
                        ? styles.pending
                        : b.status === 'APPROVED'
                          ? styles.approved
                          : styles.rejected
                    }
                  >
                    {b.status}
                  </span>
                </td>
                <td style={styles.td}>
                  {b.status === 'PENDING' ? (
                    <>
                      <button style={styles.approveBtn} onClick={() => approve(b.id)} type="button">
                        Approve
                      </button>
                      <button style={styles.rejectBtn} onClick={() => openRejectModal(b.id)} type="button">
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#64748b' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={7}>
                  No bookings found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {rejectModal.open ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ marginTop: 0 }}>Reject Booking</h3>
            <p style={{ marginTop: 0, color: '#64748b' }}>Please provide a reason for rejection.</p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={styles.textarea}
              placeholder="Reason for rejection..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button type="button" style={styles.cancelBtn} onClick={closeRejectModal}>
                Cancel
              </button>
              <button type="button" style={styles.rejectBtn} onClick={reject}>
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const styles = {
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0', padding: 12 },
  td: { fontSize: 14, color: '#111827', borderBottom: '1px solid #f1f5f9', padding: 12, verticalAlign: 'top' },
  select: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 10px', fontSize: 14, background: '#fff' },
  pending: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 999,
    background: '#fffbeb',
    color: '#a16207',
    fontSize: 12,
    fontWeight: 700,
  },
  approved: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 999,
    background: '#ecfdf5',
    color: '#047857',
    fontSize: 12,
    fontWeight: 700,
  },
  rejected: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 999,
    background: '#fff1f2',
    color: '#be123c',
    fontSize: 12,
    fontWeight: 700,
  },
  approveBtn: {
    border: '1px solid #86efac',
    background: '#f0fdf4',
    color: '#166534',
    borderRadius: 7,
    padding: '6px 10px',
    cursor: 'pointer',
    marginRight: 8,
    fontWeight: 600,
  },
  rejectBtn: {
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#b91c1c',
    borderRadius: 7,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  cancelBtn: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    borderRadius: 7,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 600,
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
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '9px 10px',
    fontSize: 14,
    resize: 'vertical',
  },
}
