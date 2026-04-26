import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../AuthContext.jsx'
import {
  fetchAllTickets,
  updateTicketStatus,
  getTicketComments,
  addTicketComment
} from '../../api/ticketsApi.js'

// --- Constants ---
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const DUMMY_TECHNICIANS = [
  { id: 1, name: "Kasun Perera", category: "Electrical" },
  { id: 2, name: "Nimal Silva", category: "Network" },
  { id: 3, name: "Amal Fernando", category: "Hardware" },
  { id: 4, name: "Sahan Jayasekara", category: "Plumbing" }
]

const CATEGORIES = ["Electrical", "Network", "Hardware", "Plumbing"]

// --- Helper Components ---
const Badge = ({ children, type, style = {} }) => {
  const baseStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ...style
  }

  const types = {
    // Priority
    LOW: { background: '#ecfdf5', color: '#065f46' },
    MEDIUM: { background: '#fffbeb', color: '#92400e' },
    HIGH: { background: '#fff1f2', color: '#9f1239' },
    CRITICAL: { background: '#450a0a', color: '#fef2f2' },
    // Status
    OPEN: { background: '#eff6ff', color: '#1e40af' },
    IN_PROGRESS: { background: '#fef9c3', color: '#854d0e' },
    RESOLVED: { background: '#f0fdf4', color: '#166534' },
    CLOSED: { background: '#f8fafc', color: '#475569' },
    REJECTED: { background: '#fef2f2', color: '#991b1b' },
  }

  return <span style={{ ...baseStyle, ...(types[children] || {}) }}>{children}</span>
}

// --- Main Component ---
export default function TicketsAdmin() {
  const { token } = useAuth()
  
  // Data state
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Local state for frontend-only data
  const [localAssignments, setLocalAssignments] = useState({}) // { ticketId: techName }
  const [localRejectReasons, setLocalRejectReasons] = useState({}) // { ticketId: reason }
  const [localComments, setLocalComments] = useState({}) // { ticketId: [comments] }

  // Filter state
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [activeTicket, setActiveTicket] = useState(null)

  // Sub-modal states
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [newComment, setNewComment] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load all tickets
  const loadTickets = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllTickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [token])

  // --- Handlers ---

  const handleStatusUpdate = async (ticketId, status) => {
    setSubmitting(true)
    try {
      const updated = await updateTicketStatus(ticketId, status)
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
      setError(null)
    } catch (err) {
      const status = err?.response?.status
      const data = err?.response?.data
      let msg = 'Failed to update status'
      if (status === 401) {
        msg = 'Session expired. Please log in again.'
      } else if (typeof data === 'string' && data.length > 0) {
        msg = data
      } else if (data?.error) {
        msg = data.error
      } else if (data?.message) {
        msg = data.message
      } else if (err?.message) {
        msg = err.message
      }
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignTechnician = () => {
    if (!activeTicket || !selectedTech) return
    setLocalAssignments(prev => ({
      ...prev,
      [activeTicket.id]: selectedTech
    }))
    setShowAssignModal(false)
    setActiveTicket(null)
    setSelectedCategory('')
    setSelectedTech('')
  }

  const handleRejectTicket = async () => {
    if (!activeTicket || !rejectReason.trim()) return
    setSubmitting(true)
    try {
      const updated = await updateTicketStatus(activeTicket.id, 'REJECTED')
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
      setLocalRejectReasons(prev => ({
        ...prev,
        [activeTicket.id]: rejectReason
      }))
      setShowRejectModal(false)
      setActiveTicket(null)
      setRejectReason('')
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reject ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    if (!activeTicket || !newComment.trim()) return
    setSubmitting(true)
    try {
      const commentData = await addTicketComment(activeTicket.id, newComment)
      // Since we want to show latest comment in table, we might need to store it
      setLocalComments(prev => ({
        ...prev,
        [activeTicket.id]: [...(prev[activeTicket.id] || []), commentData]
      }))
      setNewComment('')
      // Reload comments for modal if needed
      fetchComments(activeTicket.id)
    } catch (err) {
      // If backend comment API fails/not implemented, store locally
      const mockComment = { id: Date.now(), text: newComment, userName: 'Admin', createdAt: new Date().toISOString() }
      setLocalComments(prev => ({
        ...prev,
        [activeTicket.id]: [...(prev[activeTicket.id] || []), mockComment]
      }))
      setNewComment('')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchComments = async (ticketId) => {
    try {
      const data = await getTicketComments(ticketId)
      setLocalComments(prev => ({
        ...prev,
        [ticketId]: data
      }))
    } catch (err) {
      console.log("Using local comments or empty state")
    }
  }

  // --- Filtering ---
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesStatus = !filterStatus || t.status === filterStatus
      const matchesPriority = !filterPriority || t.priority === filterPriority
      const matchesSearch = !searchQuery || 
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.resource?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesPriority && matchesSearch
    })
  }, [tickets, filterStatus, filterPriority, searchQuery])

  // --- Render Helpers ---

  const getStatusStyle = (status) => {
    const map = {
      OPEN: { backgroundColor: '#eff6ff', color: '#1e40af' },
      IN_PROGRESS: { backgroundColor: '#fffbeb', color: '#b45309' },
      RESOLVED: { backgroundColor: '#f0fdf4', color: '#15803d' },
      CLOSED: { backgroundColor: '#f8fafc', color: '#475569' },
      REJECTED: { backgroundColor: '#fef2f2', color: '#b91c1c' },
    }
    return map[status] || map.OPEN
  }

  const renderModal = (title, isOpen, onClose, content) => {
    if (!isOpen) return null
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>{title}</h3>
            <button onClick={onClose} style={styles.closeBtn}>&times;</button>
          </div>
          <div style={styles.modalBody}>{content}</div>
        </div>
      </div>
    )
  }

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = tickets.length
    const open = tickets.filter(t => t.status === 'OPEN').length
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length
    const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length
    return { total, open, inProgress, resolved }
  }, [tickets])

  const renderStatCard = (label, value, color) => (
    <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Ticket Management</h1>
          <p style={styles.subtitle}>Overview of all maintenance requests across the campus.</p>
        </div>
        <button 
          onClick={loadTickets} 
          disabled={loading} 
          style={{
            ...styles.refreshBtn,
            opacity: loading ? 0.7 : 1,
            transform: loading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </header>

      <div style={styles.statsRow}>
        {renderStatCard("Total Tickets", stats.total, "#6366f1")}
        {renderStatCard("Open", stats.open, "#3b82f6")}
        {renderStatCard("In Progress", stats.inProgress, "#f59e0b")}
        {renderStatCard("Resolved/Closed", stats.resolved, "#10b981")}
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <input 
            type="text" 
            placeholder="Search by description, resource, or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.select}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            style={styles.select}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Resource & Location</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Technician</th>
              <th style={styles.th}>Latest Comment</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(t => (
              <tr key={t.id} style={styles.tr}>
                <td style={styles.td}><strong>#{t.id}</strong></td>
                <td style={styles.td}>
                  <div style={styles.primaryText}>{t.resource}</div>
                  <div style={styles.secondaryText}>{t.location}</div>
                </td>
                <td style={styles.td}>
                  <div style={styles.descriptionText} title={t.description}>
                    {t.description || 'No description'}
                  </div>
                </td>
                <td style={styles.td}><Badge>{t.priority}</Badge></td>
                <td style={styles.td}>
                  <select 
                    value={t.status}
                    onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                    disabled={submitting || t.status === 'REJECTED'}
                    style={{
                      ...styles.statusSelect,
                      ...getStatusStyle(t.status),
                    }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={styles.td}>
                  <div style={styles.techCell}>
                    <div style={{
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: '#f1f5f9', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#64748b'
                    }}>
                      {localAssignments[t.id] ? localAssignments[t.id].charAt(0) : '?'}
                    </div>
                    <div>
                      {localAssignments[t.id] ? (
                        <span style={styles.techName}>{localAssignments[t.id]}</span>
                      ) : (
                        <span style={styles.unassigned}>Unassigned</span>
                      )}
                    </div>
                    <button 
                      onClick={() => { setActiveTicket(t); setShowAssignModal(true); }}
                      style={styles.iconBtn}
                      title="Assign Technician"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.commentCell}>
                    <div style={styles.latestComment}>
                      {localComments[t.id]?.length > 0 
                        ? localComments[t.id][localComments[t.id].length - 1].text || localComments[t.id][localComments[t.id].length - 1].message
                        : 'No comments'}
                    </div>
                    <button 
                      onClick={() => { setActiveTicket(t); fetchComments(t.id); setShowCommentModal(true); }}
                      style={styles.textBtn}
                    >
                      View/Add
                    </button>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button 
                      onClick={() => { setActiveTicket(t); setRejectReason(''); setShowRejectModal(true); }}
                      disabled={t.status === 'REJECTED'}
                      style={{...styles.actionBtn, ...styles.rejectBtn, opacity: t.status === 'REJECTED' ? 0.5 : 1}}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && !loading && (
              <tr>
                <td colSpan="8" style={styles.emptyState}>
                  No tickets found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Modals --- */}

      {renderModal("Assign Technician", showAssignModal, () => setShowAssignModal(false), (
        <div style={styles.modalFields}>
          <div style={styles.field}>
            <label style={styles.label}>Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedTech(''); }}
              style={styles.input}
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Technician</label>
            <select 
              value={selectedTech} 
              onChange={(e) => setSelectedTech(e.target.value)}
              disabled={!selectedCategory}
              style={styles.input}
            >
              <option value="">Select Technician</option>
              {DUMMY_TECHNICIANS
                .filter(tech => tech.category === selectedCategory)
                .map(tech => <option key={tech.id} value={tech.name}>{tech.name}</option>)
              }
            </select>
          </div>
          <button 
            onClick={handleAssignTechnician} 
            disabled={!selectedTech}
            style={{
              ...styles.primaryBtn,
              opacity: !selectedTech ? 0.6 : 1,
              width: '100%',
              marginTop: '12px'
            }}
          >
            Confirm Assignment
          </button>
        </div>
      ))}

      {renderModal("Manage Comments", showCommentModal, () => setShowCommentModal(false), (
        <div style={styles.commentModal}>
          <div style={styles.commentList}>
            {(localComments[activeTicket?.id] || []).map((c, i) => (
              <div key={i} style={styles.commentItem}>
                <div style={styles.commentHeader}>
                  <span style={styles.commentAuthor}>{c.userName || 'Anonymous'}</span>
                  <span style={styles.commentDate}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Just now'}</span>
                </div>
                <div style={styles.commentContent}>{c.text || c.message}</div>
              </div>
            ))}
            {(!localComments[activeTicket?.id] || localComments[activeTicket?.id].length === 0) && (
              <p style={styles.noComments}>No comments found for this ticket.</p>
            )}
          </div>
          <div style={styles.addCommentBox}>
            <textarea 
              placeholder="Write a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={styles.textarea}
            />
            <button 
              onClick={handleAddComment} 
              disabled={submitting || !newComment.trim()}
              style={{
                ...styles.primaryBtn,
                opacity: submitting || !newComment.trim() ? 0.6 : 1
              }}
            >
              {submitting ? 'Adding...' : 'Post Comment'}
            </button>
          </div>
        </div>
      ))}

      {renderModal("Reject Ticket", showRejectModal, () => setShowRejectModal(false), (
        <div style={styles.modalFields}>
          <p style={styles.modalWarning}>Please provide a reason for rejecting this ticket.</p>
          <div style={styles.field}>
            <textarea 
              placeholder="Enter rejection reason..." 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={styles.textarea}
            />
          </div>
          <div style={styles.modalActions}>
            <button onClick={() => setShowRejectModal(false)} style={styles.secondaryBtn}>Cancel</button>
            <button 
              onClick={handleRejectTicket} 
              disabled={submitting || !rejectReason.trim()}
              style={{...styles.primaryBtn, backgroundColor: '#ef4444'}}
            >
              {submitting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: {
    padding: '40px 24px',
    maxWidth: '1440px',
    margin: '0 auto',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: '#334155',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '850',
    margin: 0,
    letterSpacing: '-0.04em',
    color: '#0f172a',
    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    color: '#64748b',
    marginTop: '6px',
    fontSize: '16px',
    fontWeight: '500'
  },
  refreshBtn: {
    padding: '12px 24px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s ease',
    cursor: 'default'
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '-0.02em'
  },
  errorBanner: {
    padding: '16px 20px',
    backgroundColor: '#fff1f2',
    border: '1px solid #fda4af',
    borderRadius: '12px',
    color: '#9f1239',
    marginBottom: '32px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  toolbar: {
    display: 'flex',
    gap: '20px',
    marginBottom: '32px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchBox: {
    flex: 2,
    minWidth: '300px',
    position: 'relative'
  },
  searchInput: {
    width: '100%',
    padding: '14px 20px',
    paddingLeft: '44px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    backgroundColor: '#fff',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '16px center',
    backgroundSize: '20px'
  },
  filterGroup: {
    display: 'flex',
    gap: '12px',
    flex: 1,
    justifyContent: 'flex-end'
  },
  select: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#fff',
    color: '#475569',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    minWidth: '160px',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    paddingRight: '40px'
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    textAlign: 'left'
  },
  th: {
    padding: '20px 24px',
    backgroundColor: '#f8fafc',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderBottom: '2px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(8px)'
  },
  tr: {
    transition: 'all 0.2s ease'
  },
  td: {
    padding: '20px 24px',
    fontSize: '14px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle'
  },
  primaryText: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: '15px'
  },
  secondaryText: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
    fontWeight: '500'
  },
  descriptionText: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#475569',
    lineHeight: '1.5'
  },
  statusSelect: {
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    border: '1px solid transparent',
    outline: 'none',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  techCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  techName: {
    color: '#1e293b',
    fontWeight: '600'
  },
  unassigned: {
    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: '13px'
  },
  iconBtn: {
    background: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6366f1',
    padding: '8px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  commentCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  latestComment: {
    fontSize: '13px',
    color: '#475569',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontStyle: 'italic',
    padding: '4px 8px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px'
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    padding: 0,
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'color 0.2s ease'
  },
  actions: {
    display: 'flex',
    gap: '12px'
  },
  actionBtn: {
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  rejectBtn: {
    backgroundColor: '#fff1f2',
    color: '#e11d48',
    transition: 'all 0.2s ease'
  },
  emptyState: {
    padding: '80px 40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '16px',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(12px)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '560px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '24px 32px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  modalTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.02em'
  },
  closeBtn: {
    background: '#f8fafc',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  modalBody: {
    padding: '32px'
  },
  modalFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    letterSpacing: '0.02em'
  },
  input: {
    padding: '14px 16px',
    borderRadius: '14px',
    border: '2px solid #f1f5f9',
    fontSize: '15px',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc'
  },
  textarea: {
    width: '100%',
    minHeight: '140px',
    padding: '16px',
    borderRadius: '16px',
    border: '2px solid #f1f5f9',
    fontSize: '15px',
    color: '#1e293b',
    outline: 'none',
    resize: 'vertical',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc'
  },
  primaryBtn: {
    padding: '14px 24px',
    backgroundColor: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  secondaryBtn: {
    padding: '14px 24px',
    backgroundColor: '#fff',
    border: '2px solid #f1f5f9',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '12px'
  },
  modalWarning: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.6'
  },
  commentModal: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  commentList: {
    maxHeight: '350px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingRight: '8px'
  },
  commentItem: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '18px',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.2s ease'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  commentAuthor: {
    fontWeight: '800',
    fontSize: '13px',
    color: '#0f172a'
  },
  commentDate: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  commentContent: {
    fontSize: '14px',
    color: '#334155',
    lineHeight: '1.6'
  },
  noComments: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '15px',
    fontStyle: 'italic'
  },
  addCommentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9'
  }
}
