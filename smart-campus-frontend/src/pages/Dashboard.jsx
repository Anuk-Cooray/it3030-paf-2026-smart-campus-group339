import { AlertTriangle, CalendarPlus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

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
      className="mx-auto max-w-7xl space-y-8 p-6 sm:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white shadow-lg"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        <div className="relative flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            
            <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {(user?.name || 'User').split(' ')[0]}!
            </h1>
            <br></br>
            <br></br>
          </div>
          <div className="hidden items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md sm:flex">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-100">System Status: Online</span>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="mb-4 px-1 text-lg font-semibold text-slate-800">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <button
            onClick={() => navigate('/app/bookings')}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-bl-full bg-indigo-50 transition-transform group-hover:scale-110" />
            <div className="relative mb-4 w-fit rounded-lg bg-indigo-100 p-3 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <h3 className="relative mb-2 text-xl font-bold text-slate-900">Book a Facility</h3>
            <p className="relative mb-4 text-sm text-slate-500">
              Reserve study rooms, labs, or sports facilities across campus.
            </p>
            <div className="relative mt-auto flex items-center text-sm font-medium text-indigo-600 transition-transform group-hover:translate-x-1">
              Start booking <ChevronRight className="ml-1 h-4 w-4" />
            </div>
          </button>

          <button
            onClick={() => navigate('/app/tickets')}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-bl-full bg-orange-50 transition-transform group-hover:scale-110" />
            <div className="relative mb-4 w-fit rounded-lg bg-orange-100 p-3 text-orange-600 transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="relative mb-2 text-xl font-bold text-slate-900">Report an Issue</h3>
            <p className="relative mb-4 text-sm text-slate-500">
              Submit maintenance requests for broken equipment or facility issues.
            </p>
            <div className="relative mt-auto flex items-center text-sm font-medium text-orange-600 transition-transform group-hover:translate-x-1">
              Create ticket <ChevronRight className="ml-1 h-4 w-4" />
            </div>
          </button>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <CalendarPlus className="h-5 w-5 text-slate-400" />
              My Active Bookings
            </h2>
            <Link to="/app/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>
          <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
              <CalendarPlus className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="mb-1 font-medium text-slate-700">No upcoming bookings</h3>
            <p className="max-w-xs text-sm text-slate-500">
              You don't have any facility reservations scheduled at the moment.
            </p>
            <button
              onClick={() => navigate('/app/bookings')}
              className="mt-6 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Make a Booking
            </button>
          </div>
        </div>

        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <AlertTriangle className="h-5 w-5 text-slate-400" />
              My Open Tickets
            </h2>
            <Link to="/app/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>
          <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
              <WrenchIcon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="mb-1 font-medium text-slate-700">No open tickets</h3>
            <p className="max-w-xs text-sm text-slate-500">
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
