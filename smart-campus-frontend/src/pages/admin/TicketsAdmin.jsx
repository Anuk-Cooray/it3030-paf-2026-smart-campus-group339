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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Ticket Management</h1>
          <p style={styles.subtitle}>Overview of all maintenance requests across the campus.</p>
        </div>
        <button onClick={loadTickets} disabled={loading} style={styles.refreshBtn}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </header>

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
                      borderColor: t.status === 'REJECTED' ? '#ef4444' : '#e2e8f0'
                    }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={styles.td}>
                  <div style={styles.techCell}>
                    {localAssignments[t.id] ? (
                      <span style={styles.techName}>{localAssignments[t.id]}</span>
                    ) : (
                      <span style={styles.unassigned}>Unassigned</span>
                    )}
                    <button 
                      onClick={() => { setActiveTicket(t); setShowAssignModal(true); }}
                      style={styles.iconBtn}
                      title="Assign Technician"
                    >
                      ✎
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
                      style={{...styles.actionBtn, ...styles.rejectBtn}}
                    >
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
            style={styles.primaryBtn}
          >
            Assign Technician
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
              style={styles.primaryBtn}
            >
              {submitting ? 'Adding...' : 'Add Comment'}
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
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    color: '#1e293b'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.02em',
    color: '#0f172a'
  },
  subtitle: {
    color: '#64748b',
    marginTop: '4px',
    fontSize: '15px'
  },
  refreshBtn: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'all 0.2s'
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    borderRadius: '8px',
    color: '#991b1b',
    marginBottom: '24px',
    fontSize: '14px'
  },
  toolbar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  searchBox: {
    flex: 1,
    minWidth: '300px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  filterGroup: {
    display: 'flex',
    gap: '12px'
  },
  select: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    minWidth: '160px'
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.1s'
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    verticalAlign: 'middle'
  },
  primaryText: {
    fontWeight: '600',
    color: '#0f172a'
  },
  secondaryText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px'
  },
  descriptionText: {
    maxWidth: '250px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#475569'
  },
  statusSelect: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  techCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  techName: {
    color: '#0f172a',
    fontWeight: '500'
  },
  unassigned: {
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#6366f1',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s'
  },
  commentCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  latestComment: {
    fontSize: '13px',
    color: '#64748b',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    padding: 0,
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    textDecoration: 'underline'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid transparent'
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    '&:hover': {
      backgroundColor: '#fecaca'
    }
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '15px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#94a3b8'
  },
  modalBody: {
    padding: '24px'
  },
  modalFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    resize: 'vertical'
  },
  primaryBtn: {
    padding: '12px',
    backgroundColor: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  secondaryBtn: {
    padding: '12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  },
  modalWarning: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  commentModal: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  commentList: {
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '4px'
  },
  commentItem: {
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  commentAuthor: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f172a'
  },
  commentDate: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  commentContent: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#475569'
  },
  noComments: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
    padding: '24px 0'
  },
  addCommentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '20px'
  }
}
