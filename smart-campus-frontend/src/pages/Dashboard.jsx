import { AlertTriangle, CalendarPlus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  }

  return (
    <motion.div
      className="dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        variants={itemVariants}
        className="dashboard-hero"
      >
        <div className="dashboard-hero-pattern" />
        <div className="dashboard-hero-content">
          <div>
            <h1 className="dashboard-hero-title">
              Welcome back, {(user?.name || 'User').split(' ')[0]}!
            </h1>
            <p className="dashboard-hero-subtitle">Manage bookings, tickets, and campus services from one place.</p>
          </div>
          <div className="dashboard-status">
            <div className="dashboard-status-dot" />
            <span>System Status: Online</span>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="dashboard-section-title">Quick Actions</h2>
        <div className="dashboard-actions-grid">
          <button
            onClick={() => navigate('/app/bookings')}
            className="dashboard-action-card dashboard-action-indigo"
          >
            <div className="dashboard-action-glow" />
            <div className="dashboard-action-icon">
              <CalendarPlus size={24} />
            </div>
            <h3>Book a Facility</h3>
            <p>
              Reserve study rooms, labs, or sports facilities across campus.
            </p>
            <div className="dashboard-action-link">
              Start booking <ChevronRight size={16} />
            </div>
          </button>

          <button
            onClick={() => navigate('/app/tickets')}
            className="dashboard-action-card dashboard-action-orange"
          >
            <div className="dashboard-action-glow" />
            <div className="dashboard-action-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>Report an Issue</h3>
            <p>
              Submit maintenance requests for broken equipment or facility issues.
            </p>
            <div className="dashboard-action-link">
              Create ticket <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="dashboard-summary-grid">
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-header">
            <h2>
              <CalendarPlus size={20} />
              My Active Bookings
            </h2>
            <Link to="/app/bookings">
              View All
            </Link>
          </div>
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">
              <CalendarPlus size={32} />
            </div>
            <h3>No upcoming bookings</h3>
            <p>
              You don't have any facility reservations scheduled at the moment.
            </p>
            <button
              onClick={() => navigate('/app/bookings')}
              className="dashboard-secondary-btn"
            >
              Make a Booking
            </button>
          </div>
        </div>

        <div className="dashboard-summary-card">
          <div className="dashboard-summary-header">
            <h2>
              <AlertTriangle size={20} />
              My Open Tickets
            </h2>
            <Link to="/app/tickets">
              View All
            </Link>
          </div>
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">
              <WrenchIcon width={32} height={32} />
            </div>
            <h3>No open tickets</h3>
            <p>
              Great! You haven't reported any maintenance issues recently.
            </p>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}

function WrenchIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}
