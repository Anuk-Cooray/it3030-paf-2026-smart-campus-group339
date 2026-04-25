import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (adminOnly) {
    const role = String(user?.role || '')
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN'
    if (!isAdmin) {
      return <Navigate to="/app/dashboard" replace />
    }
  }

  return children
}
