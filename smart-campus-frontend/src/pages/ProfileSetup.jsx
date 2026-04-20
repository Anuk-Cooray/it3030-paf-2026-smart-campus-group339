import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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

export default function ProfileSetup() {
  const { user, isAuthenticated, token, login } = useAuth()
  const navigate = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!user?.needsProfileSetup) {
    return <Navigate to="/app/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setBusy(true)
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      navigate('/app/dashboard')
    } catch (err) {
      setError(String(err?.message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Complete your profile</h1>
        <p style={styles.subtitle}>
          Link your campus <strong>Student ID</strong> and create a password so you can sign in without Google next
          time.
        </p>
        <p style={styles.hint}>
          Signed in as <span style={{ fontWeight: 700 }}>{user?.email}</span>
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="setup-student-id" style={styles.label}>
              Student ID
            </label>
            <input
              id="setup-student-id"
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
            <label htmlFor="setup-password" style={styles.label}>
              Password
            </label>
            <input
              id="setup-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="new-password"
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="setup-confirm" style={styles.label}>
              Confirm password
            </label>
            <input
              id="setup-confirm"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              autoComplete="new-password"
              required
            />
          </div>

          {error ? <p style={styles.error}>{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            style={{ ...styles.submitBtn, opacity: busy ? 0.75 : 1, cursor: busy ? 'wait' : 'pointer' }}
          >
            {busy ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#f7fafc',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
    padding: 'clamp(28px, 4vw, 40px)',
  },
  title: { margin: '0 0 8px', fontSize: '1.65rem', fontWeight: 800, color: '#1a202c' },
  subtitle: { margin: '0 0 12px', color: '#4a5568', lineHeight: 1.55, fontSize: '0.95rem' },
  hint: { margin: '0 0 24px', fontSize: '0.875rem', color: '#718096' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '0.875rem', color: '#4a5568', fontWeight: 600 },
  input: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: '1rem',
  },
  submitBtn: {
    marginTop: 8,
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#3182ce',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  error: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#b91c1c',
    lineHeight: 1.45,
  },
}
