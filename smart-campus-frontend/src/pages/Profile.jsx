import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { http } from '../api/http.js'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export default function Profile() {
  const { user, token, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [photoDirty, setPhotoDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name ?? '')
    setMobileNumber(user.mobileNumber ?? '')
    setPassword('')
    setProfilePicture(user.profilePicture ?? null)
    setPhotoDirty(false)
    setSuccess(false)
    setError(null)
  }, [user])

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSuccess(false)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 5 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setProfilePicture(result)
        setPhotoDirty(true)
      }
    }
    reader.onerror = () => setError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  function clearPhoto() {
    setProfilePicture(null)
    setPhotoDirty(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!token) {
      setError('You are not signed in.')
      return
    }

    const payload = {
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
    }
    if (password.trim()) {
      payload.password = password.trim()
    }
    if (photoDirty) {
      payload.profilePicture = profilePicture ?? ''
    }

    setSubmitting(true)
    try {
      const { data } = await http.put('/api/users/profile', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      updateUser(data)
      setPassword('')
      setPhotoDirty(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess(true)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data ||
        err?.message ||
        'Update failed.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Account</div>
          <h1 style={styles.title}>Your profile</h1>
          <p style={styles.lead}>Update how you appear in the hub and how we can reach you.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.avatarRow}>
          <div style={styles.avatarFrame}>
            {profilePicture ? (
              <img src={profilePicture} alt="Profile preview" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarPlaceholder}>{(name || user?.name || user?.email || '?').slice(0, 1).toUpperCase()}</div>
            )}
          </div>
          <div style={styles.avatarActions}>
            <label style={styles.fileLabel}>
              Change photo
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            </label>
            {profilePicture ? (
              <button type="button" onClick={clearPhoto} style={styles.linkBtn}>
                Remove photo
              </button>
            ) : null}
            <p style={styles.hint}>JPEG or PNG, up to 5 MB. Stored as Base64 (data URL) in the database.</p>
          </div>
        </div>

        <div style={styles.field}>
          <label htmlFor="profile-name" style={styles.label}>
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            autoComplete="name"
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="profile-mobile" style={styles.label}>
            Mobile number
          </label>
          <input
            id="profile-mobile"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            style={styles.input}
            placeholder="+94 77 …"
            autoComplete="tel"
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="profile-password" style={styles.label}>
            New password
          </label>
          <input
            id="profile-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Leave blank to keep your current password"
            autoComplete="new-password"
          />
        </div>

        {error ? <div style={styles.bannerError}>{error}</div> : null}
        {success ? <div style={styles.bannerOk}>Profile saved successfully.</div> : null}

        <div style={styles.actions}>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...styles.primaryBtn, opacity: submitting ? 0.75 : 1, cursor: submitting ? 'wait' : 'pointer' }}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  wrap: { maxWidth: 720 },
  header: { marginBottom: 20 },
  kicker: { color: '#6b7280', fontWeight: 700, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { margin: '6px 0 6px', color: '#111827', fontSize: 28, lineHeight: 1.15 },
  lead: { margin: 0, color: '#4b5563', fontSize: 15, lineHeight: 1.5 },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  avatarRow: { display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' },
  avatarFrame: {
    width: 96,
    height: 96,
    borderRadius: 999,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    flexShrink: 0,
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
    fontWeight: 800,
    color: '#9ca3af',
  },
  avatarActions: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 },
  fileLabel: {
    display: 'inline-block',
    width: 'fit-content',
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: '#fff',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
  },
  linkBtn: {
    alignSelf: 'flex-start',
    border: 'none',
    background: 'none',
    padding: 0,
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  hint: { margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.45 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%',
    maxWidth: 420,
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 15,
  },
  bannerError: {
    marginBottom: 14,
    padding: '10px 12px',
    borderRadius: 8,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: 14,
  },
  bannerOk: {
    marginBottom: 14,
    padding: '10px 12px',
    borderRadius: 8,
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#047857',
    fontSize: 14,
  },
  actions: { marginTop: 8 },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
}
