import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../AuthContext'
import {
  fetchBookings, createBooking, updateBookingStatus,
  deleteBooking, fetchAvailability, exportBookingsCsv
} from '../api/bookingsApi'

const RESOURCES = [
  'Main Auditorium',
  'Computer Lab 1',
  'Computer Lab 2',
  'Library Study Room A',
  'Conference Hall'
]

// Get Monday of the week for a given date
function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export default function Bookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form state
  const [resourceName, setResourceName] = useState(RESOURCES[0])
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [expectedAttendees, setExpectedAttendees] = useState(1)

  // Admin filter
  const [filter, setFilter] = useState('ALL')

  // Rejection modal
  const [rejectModal, setRejectModal] = useState({ open: false, bookingId: null })
  const [rejectReason, setRejectReason] = useState('')

  // Feature 1: Heatmap state
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapResource, setHeatmapResource] = useState(RESOURCES[0])
  const [heatmapWeekStart, setHeatmapWeekStart] = useState(getWeekStart())
  const [heatmapData, setHeatmapData] = useState(null)
  const [heatmapLoading, setHeatmapLoading] = useState(false)

  // Feature 4: Export state
  const [exportStatus, setExportStatus] = useState('ALL')
  const [exporting, setExporting] = useState(false)

  const isAdmin = user?.role === 'ROLE_ADMIN'
  const todayStr = new Date().toISOString().split('T')[0]

  const loadBookings = async () => {
    try {
      setLoading(true)
      const data = await fetchBookings()
      setBookings(data || [])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBookings() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      if (startTime >= endTime) throw new Error('Start time must be before end time.')
      await createBooking({ resourceName, bookingDate, startTime, endTime, purpose, expectedAttendees: parseInt(expectedAttendees) })
      setBookingDate(''); setStartTime(''); setEndTime(''); setPurpose(''); setExpectedAttendees(1)
      loadBookings()
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Failed to create booking')
    }
  }

  const handleStatusUpdate = async (id, status) => {
    if (status === 'REJECTED') {
      setRejectReason('')
      setRejectModal({ open: true, bookingId: id })
      return
    }
    try {
      await updateBookingStatus(id, { status, adminReason: '' })
      loadBookings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) { setError('Rejection reason cannot be empty.'); return }
    try {
      await updateBookingStatus(rejectModal.bookingId, { status: 'REJECTED', adminReason: rejectReason.trim() })
      setRejectModal({ open: false, bookingId: null }); setRejectReason('')
      loadBookings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject booking')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking? This cannot be undone.')) return
    try {
      await deleteBooking(id)
      loadBookings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete booking')
    }
  }

  // Feature 1: Load heatmap
  const loadHeatmap = async () => {
    setHeatmapLoading(true)
    try {
      const data = await fetchAvailability(heatmapResource, heatmapWeekStart)
      setHeatmapData(data)
    } catch (err) {
      setError('Failed to load availability data')
    } finally {
      setHeatmapLoading(false)
    }
  }

  useEffect(() => {
    if (showHeatmap) loadHeatmap()
  }, [showHeatmap, heatmapResource, heatmapWeekStart])

  // Feature 4: Export CSV
  const handleExport = async () => {
    setExporting(true)
    try {
      await exportBookingsCsv(exportStatus)
    } catch (err) {
      setError('Failed to export bookings')
    } finally {
      setExporting(false)
    }
  }

  const filteredBookings = useMemo(() => {
    if (filter === 'ALL') return bookings
    return bookings.filter(b => b.status === filter)
  }, [bookings, filter])

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#10b981'
      case 'PENDING': return '#f59e0b'
      case 'REJECTED': return '#ef4444'
      case 'CANCELLED': return '#6b7280'
      default: return '#374151'
    }
  }

  // Days of week labels
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={styles.container}>

      {/* Rejection Modal */}
      {rejectModal.open && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Reject Booking</h3>
            <p style={styles.modalDesc}>Provide a reason — this will be visible to the user.</p>
            <textarea style={styles.modalTextarea} value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..." rows={4} autoFocus />
            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn}
                onClick={() => { setRejectModal({ open: false, bookingId: null }); setRejectReason('') }}>
                Cancel
              </button>
              <button style={styles.modalConfirmBtn} onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <h2 style={styles.title}>Booking Management</h2>
        <p style={styles.subtitle}>
          {isAdmin ? 'Manage campus resource bookings and resolve scheduling conflicts.' : 'Request and track your resource bookings.'}
        </p>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <strong>Error: </strong>{error}
          <button style={styles.closeBtn} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Feature 1: Heatmap Section — available to all users */}
      <div style={styles.card}>
        <div style={styles.cardHeaderFlex}>
          <h3 style={styles.cardTitle}>📅 Resource Availability Heatmap</h3>
          <button style={styles.toggleBtn} onClick={() => setShowHeatmap(v => !v)}>
            {showHeatmap ? 'Hide' : 'Show'}
          </button>
        </div>

        {showHeatmap && (
          <div>
            <div style={styles.heatmapControls}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Resource</label>
                <select style={styles.input} value={heatmapResource} onChange={e => setHeatmapResource(e.target.value)}>
                  {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Week Starting (Monday)</label>
                <input type="date" style={styles.input} value={heatmapWeekStart}
                  onChange={e => setHeatmapWeekStart(e.target.value)} />
              </div>
            </div>

            {heatmapLoading ? (
              <div style={styles.loadingState}>Loading availability...</div>
            ) : heatmapData ? (
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={styles.heatmapTable}>
                  <thead>
                    <tr>
                      <th style={styles.heatmapTh}>Time</th>
                      {Object.keys(heatmapData).map((date, i) => (
                        <th key={date} style={styles.heatmapTh}>
                          {DAY_LABELS[i]}<br />
                          <span style={{ fontSize: '11px', fontWeight: 400 }}>{date.slice(5)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData[Object.keys(heatmapData)[0]]?.map((slotObj, si) => (
                      <tr key={si}>
                        <td style={styles.heatmapTimeCell}>{slotObj.slot}</td>
                        {Object.keys(heatmapData).map(date => {
                          const slot = heatmapData[date][si]
                          const isBusy = slot.status === 'BUSY'
                          return (
                            <td key={date} style={{
                              ...styles.heatmapCell,
                              backgroundColor: isBusy ? '#fecaca' : '#d1fae5',
                              color: isBusy ? '#991b1b' : '#065f46'
                            }}>
                              {isBusy ? '🔴' : '🟢'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={styles.heatmapLegend}>
                  <span style={styles.legendBusy}>🔴 Busy</span>
                  <span style={styles.legendFree}>🟢 Free</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Feature 4: Export Section — Admin only */}
      {isAdmin && (
        <div style={{ ...styles.card, marginTop: '0' }}>
          <div style={styles.cardHeaderFlex}>
            <h3 style={styles.cardTitle}>📤 Export Bookings</h3>
          </div>
          <div style={styles.exportRow}>
            <select style={styles.input} value={exportStatus} onChange={e => setExportStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button style={styles.exportBtn} onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : '⬇ Export CSV'}
            </button>
          </div>
        </div>
      )}

      <div style={styles.contentGrid}>
        {/* Booking Form — Students only */}
        {!isAdmin && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Request Resource</h3>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Resource</label>
                <select style={styles.input} value={resourceName} onChange={e => setResourceName(e.target.value)} required>
                  {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input type="date" style={styles.input} value={bookingDate} min={todayStr}
                  onChange={e => setBookingDate(e.target.value)} required />
              </div>
              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Time</label>
                  <input type="time" style={styles.input} value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Time</label>
                  <input type="time" style={styles.input} value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Expected Attendees</label>
                <input type="number" min="1" style={styles.input} value={expectedAttendees}
                  onChange={e => setExpectedAttendees(e.target.value)} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Purpose</label>
                <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                  value={purpose} onChange={e => setPurpose(e.target.value)}
                  placeholder="Describe why you need this resource..." required />
              </div>
              <button type="submit" style={styles.submitBtn}>Submit Request</button>
            </form>
          </div>
        )}

        {/* Bookings List */}
        <div style={{ ...styles.card, flex: 2 }}>
          <div style={styles.cardHeaderFlex}>
            <h3 style={styles.cardTitle}>{isAdmin ? 'All Booking Requests' : 'Your Bookings'}</h3>
            {isAdmin && (
              <select style={styles.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            )}
          </div>

          <div style={styles.listContainer}>
            {loading ? (
              <div style={styles.loadingState}>Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div style={styles.emptyState}>No bookings found.</div>
            ) : (
              <div style={styles.grid}>
                {filteredBookings.map(booking => (
                  <div key={booking.id} style={styles.bookingItem}>
                    <div style={styles.bookingHeader}>
                      <span style={styles.resourceTag}>{booking.resourceName}</span>
                      <span style={{ ...styles.statusBadge, color: getStatusColor(booking.status), borderColor: getStatusColor(booking.status), backgroundColor: `${getStatusColor(booking.status)}1A` }}>
                        {booking.status}
                      </span>
                    </div>
                    <div style={styles.bookingDetails}>
                      <p><strong>Date:</strong> {booking.bookingDate}</p>
                      <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
                      {isAdmin && <p><strong>User:</strong> {booking.user?.name || booking.user?.email}</p>}
                      <p><strong>Attendees:</strong> {booking.expectedAttendees}</p>
                      <p style={styles.purposeText}><strong>Purpose:</strong> {booking.purpose}</p>
                      {booking.adminReason && (
                        <p style={styles.reasonText}><strong>Admin Note:</strong> {booking.adminReason}</p>
                      )}
                    </div>
                    <div style={styles.actionRow}>
                      {isAdmin && booking.status === 'PENDING' && (
                        <>
                          <button style={styles.approveBtn} onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}>Approve</button>
                          <button style={styles.rejectBtn} onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}>Reject</button>
                        </>
                      )}
                      {!isAdmin && (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                        <button style={styles.cancelBtn} onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}>Cancel Booking</button>
                      )}
                      {(isAdmin || (booking.user?.id === user?.id && (booking.status === 'CANCELLED' || booking.status === 'REJECTED'))) && (
                        <button style={styles.deleteBtn} onClick={() => handleDelete(booking.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: "'Inter', system-ui, sans-serif", color: '#1f2937', display: 'flex', flexDirection: 'column', gap: '24px' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalTitle: { margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#111827' },
  modalDesc: { margin: '0 0 20px', fontSize: '14px', color: '#6b7280' },
  modalTextarea: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '15px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' },
  modalCancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  modalConfirmBtn: { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  header: { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '32px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' },
  title: { margin: 0, fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px' },
  subtitle: { margin: '8px 0 0', fontSize: '16px', opacity: 0.9 },
  errorAlert: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', color: '#b91c1c', fontSize: '24px', cursor: 'pointer', padding: '0 8px' },
  contentGrid: { display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap' },
  card: { background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' },
  cardHeader: { borderBottom: '2px solid #f3f4f6', paddingBottom: '16px' },
  cardHeaderFlex: { borderBottom: '2px solid #f3f4f6', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' },
  toggleBtn: { padding: '6px 16px', borderRadius: '8px', border: '1px solid #4f46e5', background: 'transparent', color: '#4f46e5', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  heatmapControls: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  heatmapTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  heatmapTh: { padding: '8px 12px', background: '#f3f4f6', textAlign: 'center', fontWeight: '600', border: '1px solid #e5e7eb' },
  heatmapTimeCell: { padding: '6px 12px', fontWeight: '500', color: '#374151', border: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
  heatmapCell: { padding: '6px', textAlign: 'center', border: '1px solid #e5e7eb', fontSize: '16px' },
  heatmapLegend: { display: 'flex', gap: '20px', marginTop: '12px', fontSize: '13px' },
  legendBusy: { color: '#991b1b' },
  legendFree: { color: '#065f46' },
  exportRow: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  exportBtn: { padding: '12px 24px', borderRadius: '10px', backgroundColor: '#4f46e5', color: 'white', fontSize: '15px', fontWeight: '600', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' },
  filterSelect: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  row: { display: 'flex', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  label: { fontSize: '14px', fontWeight: '500', color: '#4b5563' },
  input: { padding: '12px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', outline: 'none' },
  submitBtn: { marginTop: '12px', padding: '14px', borderRadius: '10px', backgroundColor: '#4f46e5', color: 'white', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer' },
  listContainer: { display: 'flex', flexDirection: 'column', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  loadingState: { padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '16px' },
  emptyState: { padding: '60px 40px', textAlign: 'center', color: '#9ca3af', fontSize: '18px', background: '#f9fafb', borderRadius: '16px', border: '2px dashed #e5e7eb' },
  bookingItem: { background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' },
  bookingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resourceTag: { fontWeight: '700', color: '#1f2937', fontSize: '16px' },
  statusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.5px' },
  bookingDetails: { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '4px' },
  purposeText: { marginTop: '6px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '8px', color: '#374151' },
  reasonText: { marginTop: '6px', backgroundColor: '#fef2f2', color: '#991b1b', padding: '8px', borderRadius: '8px', borderLeft: '4px solid #ef4444' },
  actionRow: { display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' },
  approveBtn: { flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' },
  rejectBtn: { flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', fontWeight: '600', cursor: 'pointer' },
  deleteBtn: { padding: '8px 14px', borderRadius: '8px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', fontWeight: '600', cursor: 'pointer' }
}