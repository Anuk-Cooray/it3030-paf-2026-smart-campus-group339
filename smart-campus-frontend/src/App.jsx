import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RequireCompleteProfile from './components/RequireCompleteProfile.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Facilities from './pages/Facilities.jsx'
import Bookings from './pages/Bookings.jsx'
import Tickets from './pages/Tickets.jsx'
import Profile from './pages/Profile.jsx'



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <RequireCompleteProfile>
                <Layout />
              </RequireCompleteProfile>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="facilities" element={<Facilities />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
