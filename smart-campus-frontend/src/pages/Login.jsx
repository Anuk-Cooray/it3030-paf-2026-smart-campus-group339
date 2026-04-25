import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

function userFromAuthPayload(data) {
  return {
    userId: data.userId,
    email: data.email,
    name: data.name,
    role: data.role,
    studentId: data.studentId ?? null,
    needsProfileSetup: Boolean(data.needsProfileSetup),
  }
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [oauthError, setOauthError] = useState(null)
  const [standardError, setStandardError] = useState(null)

  function routeAfterAuth(data) {
    const role = String(data?.role || '')
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN'
    navigate(data.needsProfileSetup ? '/complete-profile' : isAdmin ? '/admin/dashboard' : '/app/dashboard')
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setOauthError(null)
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      })

      const text = await response.text()
      if (!response.ok) {
        if (response.status === 502) {
          throw new Error(
            'HTTP 502 from dev proxy (backend not reachable on http://localhost:8080). Start Spring Boot.',
          )
        }
        throw new Error(text || `HTTP ${response.status}`)
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Expected JSON from /api/auth/google but got: ${text.slice(0, 200)}`)
      }

      if (!data?.token) {
        throw new Error(
          `Backend JSON missing "token". Received keys: ${Object.keys(data || {}).join(', ') || '(empty)'}`,
        )
      }

      login(userFromAuthPayload(data), data.token)
      routeAfterAuth(data)
    } catch (err) {
      console.error('Google login failed:', err)
      setOauthError(String(err?.message || err))
    }
  }

  const handleStandardLogin = async (e) => {
    e.preventDefault()
    setStandardError(null)
    setOauthError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim(), password }),
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(text || `HTTP ${response.status}`)
      }

      if (!response.ok) {
        throw new Error(data?.error || text || `HTTP ${response.status}`)
      }

      if (!data?.token) {
        throw new Error(
          `Backend JSON missing "token". Received keys: ${Object.keys(data || {}).join(', ') || '(empty)'}`,
        )
      }

      login(userFromAuthPayload(data), data.token)
      routeAfterAuth(data)
    } catch (err) {
      setStandardError(String(err?.message || err))
    }
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.leftPanel}>
        <h1 style={styles.heroTitle}>Smart Campus</h1>
        <p style={styles.heroSubtitle}>Modernizing day-to-day operations.</p>
        <ul style={styles.featureList}>
          <li>- Book facilities and equipment</li>
          <li>- Report maintenance issues</li>
          <li>- Real-time status tracking</li>
        </ul>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          <h2 style={styles.loginTitle}>Welcome back</h2>
          <p style={styles.loginSubtitle}>Sign in with your Student ID or continue with Google.</p>

          <form onSubmit={handleStandardLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="login-student-id" style={styles.label}>
                Student ID
              </label>
              <input
                id="login-student-id"
                type="text"
                placeholder="e.g. IT23328020"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={styles.input}
                autoComplete="username"
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="login-password" style={styles.label}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                autoComplete="current-password"
                required
              />
            </div>
            {standardError ? <p style={styles.inlineError}>{standardError}</p> : null}
            <button type="submit" style={styles.submitBtn}>
              Sign in
            </button>
          </form>

          <div style={styles.dividerContainer}>
            <hr style={styles.dividerLine} />
            <span style={styles.dividerText}>OR</span>
            <hr style={styles.dividerLine} />
          </div>

          <div style={styles.googleContainer}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                console.log('Google Login Failed')
                setOauthError('Google sign-in was cancelled or failed.')
              }}
              useOneTap={false}
            />
          </div>

          {oauthError ? <p style={styles.error}>{oauthError}</p> : null}
        </div>
      </div>
    </div>
  )
}

const styles = {
  pageContainer: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  leftPanel: {
    flex: 1,
    minWidth: 0,
    background: 'linear-gradient(160deg, #1a365d 0%, #2c5282 45%, #1a365d 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 'clamp(32px, 8vw, 80px)',
  },
  heroTitle: { fontSize: 'clamp(2rem, 4vw, 3.25rem)', margin: '0 0 10px', fontWeight: 800, letterSpacing: '-0.02em' },
  heroSubtitle: { fontSize: '1.15rem', opacity: 0.88, margin: '0 0 28px', maxWidth: 420, lineHeight: 1.5 },
  featureList: { listStyle: 'none', padding: 0, margin: 0, fontSize: '1.05rem', lineHeight: 2, opacity: 0.95 },
  rightPanel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f7fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loginCard: {
    backgroundColor: '#fff',
    padding: 'clamp(32px, 5vw, 48px)',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
    width: '100%',
    maxWidth: 440,
    border: '1px solid #e2e8f0',
  },
  loginTitle: { fontSize: '1.75rem', color: '#1a202c', margin: '0 0 8px', fontWeight: 800 },
  loginSubtitle: { color: '#718096', margin: '0 0 28px', fontSize: '0.95rem', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '0.875rem', color: '#4a5568', fontWeight: 600 },
  input: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  submitBtn: {
    backgroundColor: '#3182ce',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 6,
  },
  inlineError: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#b91c1c',
    lineHeight: 1.45,
  },
  dividerContainer: { display: 'flex', alignItems: 'center', margin: '28px 0' },
  dividerLine: { flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' },
  dividerText: { padding: '0 14px', color: '#a0aec0', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em' },
  googleContainer: { display: 'flex', justifyContent: 'center' },
  error: {
    margin: '16px 0 0',
    fontSize: '0.875rem',
    color: '#b91c1c',
    lineHeight: 1.45,
  },
}
