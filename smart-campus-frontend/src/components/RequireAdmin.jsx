import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

/**
 * Wraps a route so it is accessible only to authenticated users with ROLE_ADMIN.
 * Unauthenticated visitors are sent to the login page.
 * Authenticated non-admins are redirected to the student dashboard.
 */
export default function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (user?.role !== 'ROLE_ADMIN') return <Navigate to="/app/dashboard" replace />

  return children
}
