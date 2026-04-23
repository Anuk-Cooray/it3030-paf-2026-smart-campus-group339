import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

/** Blocks the main app shell until Google-only users link a Student ID + password. */
export default function RequireCompleteProfile({ children }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (user?.needsProfileSetup) {
    return <Navigate to="/complete-profile" replace />
  }

  return children
}
