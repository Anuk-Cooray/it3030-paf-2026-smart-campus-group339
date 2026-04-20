import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../AuthContext'
import { fetchBookings, createBooking, updateBookingStatus } from '../api/bookingsApi'

export default function Bookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  
  // Form state
  const [resourceName, setResourceName] = useState('Main Auditorium')
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [expectedAttendees, setExpectedAttendees] = useState(1)

  // Status Filter for Admin
  const [filter, setFilter] = useState('ALL')

  const isAdmin = user?.role === 'ROLE_ADMIN'

  const RESOURCES = [
    { name: 'Main Auditorium', icon: '🏛️', desc: 'Seats up to 500' },
    { name: 'Computer Lab 1', icon: '💻', desc: '40 Workstations' },
    { name: 'Computer Lab 2', icon: '🖥️', desc: '30 Workstations' },
    { name: 'Library Study Room A', icon: '📚', desc: 'Quiet focus area' },
    { name: 'Conference Hall', icon: '🤝', desc: 'For meetings' },
  ]

  const loadBookings = async () => {
    try {
      setLoading(true)
      const data = await fetchBookings()
      setBookings(data || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    
    // Validations
    if (!bookingDate) return setError('Please select a date.')
    if (!startTime || !endTime) return setError('Please select both start and end times.')
    if (startTime >= endTime) return setError('Start time must be before end time.')
    if (expectedAttendees < 1) return setError('Attendees must be at least 1.')
    if (!purpose.trim()) return setError('Please provide a purpose for the booking.')

    try {
      await createBooking({
        resourceName,
        bookingDate,
        startTime,
        endTime,
        purpose,
        expectedAttendees: parseInt(expectedAttendees)
      })
      // Reset form on success
      setResourceName('Main Auditorium')
      setBookingDate('')
      setStartTime('')
      setEndTime('')
      setPurpose('')
      setExpectedAttendees(1)
      setSuccessMsg('Booking requested successfully!')
      setTimeout(() => setSuccessMsg(null), 5000)
      loadBookings()
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Failed to create booking')
    }
  }

  const handleStatusUpdate = async (id, status) => {
    let reason = ''
    if (status === 'REJECTED') {
      reason = window.prompt("Please provide a reason for rejection:")
      if (reason === null) return // cancelled
      if (!reason.trim()) {
        alert("A reason is required to reject a booking.")
        return
      }
    } else if (status === 'CANCELLED') {
      const confirm = window.confirm("Are you sure you want to cancel this booking?")
      if (!confirm) return
    }

    try {
      await updateBookingStatus(id, { status, adminReason: reason })
      loadBookings()
      setSuccessMsg(`Booking ${status.toLowerCase()} successfully.`)
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  const filteredBookings = useMemo(() => {
    if (filter === 'ALL') return bookings
    return bookings.filter(b => b.status === filter)
  }, [bookings, filter])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' }
      case 'PENDING': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
      case 'REJECTED': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }
      case 'CANCELLED': return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
    }
  }

  return (
    <div className="bookings-container">
      {/* Global CSS for premium feel without external libraries */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        .bookings-container {
          font-family: 'Outfit', sans-serif;
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 24px;
          color: #0f172a;
          background-color: #f8fafc;
          min-height: 100vh;
        }

        /* Header Styles */
        .page-header {
          position: relative;
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
          border-radius: 24px;
          padding: 48px;
          color: white;
          margin-bottom: 40px;
          overflow: hidden;
          box-shadow: 0 20px 40px -15px rgba(37, 99, 235, 0.3);
        }
        
        .page-header::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -10%;
          width: 50%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
          transform: rotate(45deg);
        }

        .page-title {
          font-size: 40px;
          font-weight: 700;
          margin: 0 0 12px 0;
          letter-spacing: -1px;
          position: relative;
          z-index: 1;
        }

        .page-subtitle {
          font-size: 18px;
          opacity: 0.9;
          margin: 0;
          font-weight: 300;
          position: relative;
          z-index: 1;
        }

        /* Alerts */
        .alert {
          padding: 16px 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
          animation: slideIn 0.3s ease-out forwards;
        }
        .alert.error {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .alert.success {
          background-color: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Layout Grid */
        .main-grid {
          display: grid;
          grid-template-columns: ${isAdmin ? '1fr' : '380px 1fr'};
          gap: 32px;
          align-items: start;
        }
        @media(max-width: 992px) {
          .main-grid { grid-template-columns: 1fr; }
        }

        /* Cards */
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Form Elements */
        .custom-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .input-label {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .fancy-input {
          padding: 14px 16px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background-color: #f8fafc;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          color: #0f172a;
          transition: all 0.2s ease;
          outline: none;
        }
        .fancy-input:focus {
          border-color: #4f46e5;
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }

        /* Resource Selector */
        .resource-selector {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 8px;
        }
        .resource-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fff;
        }
        .resource-option:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .resource-option.selected {
          border-color: #4f46e5;
          background: #eef2ff;
        }
        .res-icon { font-size: 24px; margin-right: 16px; }
        .res-info { display: flex; flex-direction: column; }
        .res-name { font-weight: 600; color: #1e293b; font-size: 15px; }
        .res-desc { font-size: 12px; color: #64748b; }

        /* Submit Button */
        .glow-btn {
          margin-top: 10px;
          padding: 16px 24px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
          color: white;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px -10px rgba(79, 70, 229, 0.5);
          position: relative;
          overflow: hidden;
        }
        .glow-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -10px rgba(79, 70, 229, 0.6);
        }
        .glow-btn:active {
          transform: translateY(0);
        }

        /* Filters */
        .filter-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .filter-tab {
          padding: 8px 20px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          transition: all 0.2s;
        }
        .filter-tab:hover { background: #e2e8f0; }
        .filter-tab.active { background: #4f46e5; color: white; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }

        /* Booking Grid */
        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .booking-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .booking-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02);
          border-color: #cbd5e1;
        }

        .bc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 16px;
        }
        .bc-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .bc-user {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bc-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .info-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #475569; }
        .info-icon { font-size: 16px; width: 20px; text-align: center; color: #94a3b8; }
        
        .bc-purpose {
          background: #f8fafc;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          color: #334155;
          margin-top: 8px;
          border-left: 3px solid #cbd5e1;
        }

        .bc-reason {
          background: #fff1f2;
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          color: #be123c;
          border: 1px solid #ffe4e6;
          display: flex;
          gap: 10px;
        }

        .bc-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .action-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }
        .btn-approve { background: #10b981; color: white; }
        .btn-approve:hover { background: #059669; }
        .btn-reject { background: #ef4444; color: white; }
        .btn-reject:hover { background: #dc2626; }
        .btn-cancel { background: white; border: 2px solid #e2e8f0; color: #64748b; }
        .btn-cancel:hover { border-color: #cbd5e1; color: #0f172a; background: #f8fafc; }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: rgba(255,255,255,0.5);
          border-radius: 24px;
          border: 2px dashed #cbd5e1;
          color: #64748b;
        }
        .empty-icon { font-size: 48px; margin-bottom: 16px; display: block; }
      `}</style>

      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Resource Booking</h1>
        <p className="page-subtitle">
          {isAdmin 
            ? 'Manage and oversee campus resource reservations globally.' 
            : 'Reserve auditoriums, labs, and study rooms with ease.'}
        </p>
      </header>

      {/* Alerts */}
      {error && (
        <div className="alert error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'inherit'}}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="alert success">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'inherit'}}>×</button>
        </div>
      )}

      <div className="main-grid">
        
        {/* Left Form: Only visible for regular users */}
        {!isAdmin && (
          <div className="glass-card left-panel">
            <h2 className="section-title">✨ Make a Request</h2>
            <form onSubmit={handleSubmit} className="custom-form">
              
              <div className="input-group">
                <label className="input-label">Select Resource</label>
                <div className="resource-selector">
                  {RESOURCES.map(res => (
                    <div 
                      key={res.name}
                      className={`resource-option ${resourceName === res.name ? 'selected' : ''}`}
                      onClick={() => setResourceName(res.name)}
                    >
                      <span className="res-icon">{res.icon}</span>
                      <div className="res-info">
                        <span className="res-name">{res.name}</span>
                        <span className="res-desc">{res.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Date</label>
                <input 
                  type="date" 
                  className="fancy-input" 
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Start Time</label>
                  <input 
                    type="time" 
                    className="fancy-input" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">End Time</label>
                  <input 
                    type="time" 
                    className="fancy-input" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Expected Attendees</label>
                <input 
                  type="number" 
                  min="1"
                  className="fancy-input" 
                  value={expectedAttendees}
                  onChange={e => setExpectedAttendees(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Purpose Context</label>
                <textarea 
                  className="fancy-input" 
                  rows="3"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Describe the nature of your event or study session..."
                  required
                />
              </div>

              <button type="submit" className="glow-btn">
                Submit Reservation
              </button>
            </form>
          </div>
        )}

        {/* Right/Main Panel: Bookings View */}
        <div className="glass-card right-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              {isAdmin ? '📋 All Global Requests' : '📅 Your Reservations'}
            </h2>
          </div>

          {/* Filters (Admin often needs filtering, let's provide it for everyone for better UX) */}
          <div className="filter-tabs">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(tab => (
              <button 
                key={tab} 
                className={`filter-tab ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab === 'ALL' ? 'All Bookings' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state">
              <span className="empty-icon">⏳</span>
              <h3>Loading Reservations...</h3>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏜️</span>
              <h3>No bookings found</h3>
              <p>Nothing matches your current filter.</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {filteredBookings.map(booking => {
                const sStyle = getStatusStyle(booking.status)
                const resIcon = RESOURCES.find(r => r.name === booking.resourceName)?.icon || '🏢'
                
                return (
                  <div key={booking.id} className="booking-card">
                    {/* Card Header */}
                    <div className="bc-header">
                      <div>
                        <h4 className="bc-title">{resIcon} {booking.resourceName}</h4>
                        {isAdmin && <div className="bc-user">👤 {booking.user?.name || booking.user?.email}</div>}
                      </div>
                      <div className="status-badge" style={{ backgroundColor: sStyle.bg, color: sStyle.text, border: `1px solid ${sStyle.border}` }}>
                        {booking.status === 'APPROVED' && '✓'}
                        {booking.status === 'PENDING' && '⏳'}
                        {booking.status === 'REJECTED' && '✕'}
                        {booking.status === 'CANCELLED' && '⊘'}
                        {booking.status}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="bc-body">
                      <div className="info-row">
                        <span className="info-icon">📅</span> 
                        <strong>{new Date(booking.bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric'})}</strong>
                      </div>
                      <div className="info-row">
                        <span className="info-icon">⏱️</span> 
                        {booking.startTime.slice(0,5)} — {booking.endTime.slice(0,5)}
                      </div>
                      <div className="info-row">
                        <span className="info-icon">👥</span> 
                        {booking.expectedAttendees} Attendees Expected
                      </div>
                      
                      <div className="bc-purpose">
                        <strong>Purpose:</strong> {booking.purpose}
                      </div>

                      {booking.adminReason && (
                        <div className="bc-reason">
                          <span>🛑</span>
                          <div>
                            <strong>Admin Note:</strong><br/>
                            {booking.adminReason}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="bc-actions">
                      {isAdmin && booking.status === 'PENDING' && (
                        <>
                          <button className="action-btn btn-approve" onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}>
                            ✓ Approve
                          </button>
                          <button className="action-btn btn-reject" onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}>
                            ✕ Reject
                          </button>
                        </>
                      )}
                      {!isAdmin && (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                        <button className="action-btn btn-cancel" onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}>
                          Cancel Request
                        </button>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
