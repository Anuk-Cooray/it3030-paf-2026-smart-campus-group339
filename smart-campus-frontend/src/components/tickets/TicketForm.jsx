import { useState } from 'react'
import { useAuth } from '../../AuthContext'

const INITIAL_FORM_DATA = {
  resource: '',
  location: '',
  category: 'electrical',
  description: '',
  priority: 'medium',
  contactDetails: '',
}

const CATEGORY_OPTIONS = [
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'hvac', label: 'HVAC/Cooling', icon: '❄️' },
  { value: 'structural', label: 'Structural', icon: '🏢' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'it', label: 'IT/Network', icon: '💻' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: '🟢' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'high', label: 'High', icon: '🔴' },
  { value: 'critical', label: 'Critical', icon: '🔥' },
]

export default function TicketForm({ onTicketCreated }) {
  const { token: authToken } = useAuth()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [focused, setFocused] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFocus = (fieldName) => {
    setFocused(fieldName)
  }

  const handleBlur = () => {
    setFocused(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!authToken) {
      setMessage({ type: 'error', text: 'Please log in first' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('http://localhost:8080/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(errorBody || `Server error: ${response.status}`)
      }

      await response.json()
      setMessage({ type: 'success', text: 'Ticket created successfully.' })
      setFormData(INITIAL_FORM_DATA)

      if (onTicketCreated) {
        onTicketCreated()
      }

      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    const match = CATEGORY_OPTIONS.find((item) => item.value === category)
    return match ? match.icon : '📋'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
      medium: { bg: '#fffbeb', text: '#78350f', border: '#fde68a' },
      high: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
      critical: { bg: '#7c2d12', text: '#fed7aa', border: '#92400e' },
    }
    return colors[priority] || colors.medium
  }

  const fieldStyle = (fieldName, baseStyle) => ({
    ...baseStyle,
    borderColor: focused === fieldName ? '#2563eb' : baseStyle.borderColor,
    boxShadow: focused === fieldName ? '0 0 0 3px rgba(37, 99, 235, 0.18)' : 'none',
  })

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <div style={styles.headerBadge}>Ticket Desk</div>
        <h2 style={styles.mainTitle}>Report Maintenance Issue</h2>
        <p style={styles.subtitle}>Submit clear issue details for faster resolution by campus operations.</p>
      </div>

      {message && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            borderLeft: `4px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Location Details</h4>

          <div style={styles.formGroup}>
            <label style={styles.label}>Resource or Equipment <span style={styles.required}>*</span></label>
            <input
              type="text"
              name="resource"
              value={formData.resource}
              onChange={handleChange}
              onFocus={() => handleFocus('resource')}
              onBlur={handleBlur}
              placeholder="Air Conditioner, Water Pump, Door Lock"
              required
              style={fieldStyle('resource', styles.input)}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location <span style={styles.required}>*</span></label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              onFocus={() => handleFocus('location')}
              onBlur={handleBlur}
              placeholder="Building A, Room 201"
              required
              style={fieldStyle('location', styles.input)}
            />
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Issue Classification</h4>

          <div style={styles.row}>
            <div style={{ ...styles.formGroup, flex: 1, minWidth: 240 }}>
              <label style={styles.label}>Category <span style={styles.required}>*</span></label>
              <div style={styles.selectWrapper}>
                <span style={styles.categoryIcon}>{getCategoryIcon(formData.category)}</span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  onFocus={() => handleFocus('category')}
                  onBlur={handleBlur}
                  required
                  style={fieldStyle('category', styles.select)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ ...styles.formGroup, flex: 1, minWidth: 240 }}>
              <label style={styles.label}>Priority <span style={styles.required}>*</span></label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                onFocus={() => handleFocus('priority')}
                onBlur={handleBlur}
                required
                style={{
                  ...fieldStyle('priority', styles.selectCompact),
                  backgroundColor: getPriorityColor(formData.priority).bg,
                  borderColor: focused === 'priority' ? '#2563eb' : getPriorityColor(formData.priority).border,
                  color: getPriorityColor(formData.priority).text,
                }}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Additional Details</h4>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onFocus={() => handleFocus('description')}
              onBlur={handleBlur}
              placeholder="Describe the issue, impact, and anything maintenance staff should know."
              rows={4}
              maxLength={500}
              style={fieldStyle('description', styles.textarea)}
            />
            <small style={styles.helperText}>{formData.description.length}/500 characters</small>
          </div>

          <div style={styles.formGroupNoMargin}>
            <label style={styles.label}>Preferred Contact Details</label>
            <input
              type="text"
              name="contactDetails"
              value={formData.contactDetails}
              onChange={handleChange}
              onFocus={() => handleFocus('contactDetails')}
              onBlur={handleBlur}
              placeholder="Phone number or email"
              style={fieldStyle('contactDetails', styles.input)}
            />
            <small style={styles.helperText}>Used only for maintenance updates.</small>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating Ticket...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    background: '#f8fbff',
    border: '1px solid #dbe7ff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.12)',
  },
  headerSection: {
    background:
      'linear-gradient(132deg, rgba(15, 23, 42, 0.99) 0%, rgba(30, 64, 175, 0.96) 62%, rgba(37, 99, 235, 0.93) 100%)',
    color: '#ffffff',
    padding: '18px 22px',
    borderBottom: '1px solid rgba(147, 197, 253, 0.35)',
  },
  headerBadge: {
    display: 'inline-block',
    fontSize: 11,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    background: 'rgba(191, 219, 254, 0.16)',
    color: '#bfdbfe',
    border: '1px solid rgba(191, 219, 254, 0.36)',
    borderRadius: 999,
    padding: '4px 10px',
    marginBottom: 10,
    fontWeight: 600,
  },
  mainTitle: {
    margin: '0 0 4px 0',
    fontSize: 22,
    lineHeight: 1.25,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.45,
    color: '#dbeafe',
  },
  alert: {
    margin: '16px 20px 0 20px',
    padding: '12px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  section: {
    backgroundColor: '#f8fbff',
    border: '1px solid #dbeafe',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.2px',
  },
  row: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 12,
  },
  formGroupNoMargin: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: 6,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    resize: 'vertical',
    minHeight: 100,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  select: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '10px 12px 10px 38px',
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    appearance: 'none',
    backgroundImage:
      'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%230f172a\' stroke-width=\'2\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '18px',
  },
  selectCompact: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  selectWrapper: {
    position: 'relative',
  },
  categoryIcon: {
    position: 'absolute',
    left: 11,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
    pointerEvents: 'none',
  },
  helperText: {
    marginTop: 5,
    fontSize: 11,
    color: '#64748b',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  button: {
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 65%, #2563eb 100%)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    padding: '11px 22px',
    minWidth: 160,
    boxShadow: '0 7px 18px rgba(15, 23, 42, 0.35)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
  },
}
