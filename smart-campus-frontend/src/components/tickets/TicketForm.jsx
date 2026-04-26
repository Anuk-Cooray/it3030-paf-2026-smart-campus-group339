import { useEffect, useState } from 'react'
import { useAuth } from '../../AuthContext'

const INITIAL_FORM_DATA = {
  resource: '',
  location: '',
  category: 'electrical',
  description: '',
  priority: 'medium',
  contactDetails: '',
  attachments: [],
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
  const [attachmentError, setAttachmentError] = useState('')
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadResources = async () => {
      if (!authToken) {
        setResources([])
        return
      }

      setResourcesLoading(true)
      setResourcesError('')

      try {
        const response = await fetch('http://localhost:8080/api/facilities?status=ACTIVE&size=200', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorBody = await response.text()
          throw new Error(errorBody || `Failed to fetch resources (${response.status})`)
        }

        const data = await response.json()
        const facilities = Array.isArray(data?.content) ? data.content : []

        setResources(
          facilities
            .filter((item) => item?.name && item?.location)
            .map((item) => ({
              id: item.id,
              name: item.name,
              location: item.location,
            })),
        )
      } catch (err) {
        if (err.name !== 'AbortError') {
          setResourcesError(err.message || 'Failed to load resources')
        }
      } finally {
        setResourcesLoading(false)
      }
    }

    loadResources()

    return () => controller.abort()
  }, [authToken])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleResourceSelect = (e) => {
    const selectedId = e.target.value
    const selectedResource = resources.find((item) => String(item.id) === selectedId)

    setFormData((prev) => ({
      ...prev,
      resource: selectedResource?.name || '',
      location: selectedResource?.location || '',
    }))
  }

  const selectedResourceId = resources.find(
    (item) => item.name === formData.resource && item.location === formData.location,
  )?.id

  const handleFocus = (fieldName) => {
    setFocused(fieldName)
  }

  const handleBlur = () => {
    setFocused(null)
  }

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsDataURL(file)
    })

  const handleAttachmentChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) {
      return
    }

    setAttachmentError('')

    const hasInvalidType = files.some((file) => !file.type.startsWith('image/'))
    if (hasInvalidType) {
      setAttachmentError('Only image files are allowed.')
      return
    }

    const nextCount = formData.attachments.length + files.length
    if (nextCount > 3) {
      setAttachmentError('You can attach up to 3 images only.')
      return
    }

    try {
      const encodedFiles = await Promise.all(files.map((file) => readFileAsDataUrl(file)))
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...encodedFiles],
      }))
      e.target.value = ''
    } catch {
      setAttachmentError('Failed to process image attachment. Please try again.')
    }
  }

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
    setAttachmentError('')
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

      {resourcesError && (
        <div
          style={{
            ...styles.alert,
            backgroundColor: '#fee2e2',
            borderLeft: '4px solid #ef4444',
            color: '#991b1b',
          }}
        >
          Error loading resources: {resourcesError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Location Details</h4>

          <div style={styles.formGroup}>
            <label style={styles.label}>Resource or Equipment <span style={styles.required}>*</span></label>
            {resources.length > 0 ? (
              <select
                name="resourceSelect"
                value={selectedResourceId ? String(selectedResourceId) : ''}
                onChange={handleResourceSelect}
                onFocus={() => handleFocus('resource')}
                onBlur={handleBlur}
                required
                disabled={resourcesLoading}
                style={fieldStyle('resource', styles.selectCompact)}
              >
                <option value="">{resourcesLoading ? 'Loading resources...' : 'Select a resource'}</option>
                {resources.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name} - {item.location}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="resource"
                value={formData.resource}
                onChange={handleChange}
                onFocus={() => handleFocus('resource')}
                onBlur={handleBlur}
                placeholder={resourcesLoading ? 'Loading resources...' : 'Type resource manually'}
                required
                style={fieldStyle('resource', styles.input)}
              />
            )}
            {resources.length === 0 && !resourcesLoading && !resourcesError && (
              <small style={styles.helperText}>No resources available. You can type resource details manually.</small>
            )}
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

          <div style={styles.attachmentGroup}>
            <label style={styles.label}>Image Attachments (up to 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAttachmentChange}
              disabled={formData.attachments.length >= 3}
              style={styles.fileInput}
            />
            <small style={styles.helperText}>
              Upload evidence photos such as damaged equipment or error screens.
            </small>
            {attachmentError && <small style={styles.attachmentError}>{attachmentError}</small>}

            {formData.attachments.length > 0 && (
              <div style={styles.attachmentGrid}>
                {formData.attachments.map((attachment, index) => (
                  <div key={index} style={styles.attachmentItem}>
                    <img src={attachment} alt={`Attachment ${index + 1}`} style={styles.attachmentImage} />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      style={styles.removeAttachmentButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading || resourcesLoading}
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
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)',
    backdropFilter: 'blur(12px)',
  },
  headerSection: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#ffffff',
    padding: '18px 22px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  headerBadge: {
    display: 'inline-block',
    fontSize: 11,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.18)',
    color: '#e0e7ff',
    border: '1px solid rgba(255,255,255,0.3)',
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
    color: '#e5e7eb',
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
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    color: '#111827',
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
  attachmentGroup: {
    marginTop: 14,
    borderTop: '1px solid #dbeafe',
    paddingTop: 12,
  },
  fileInput: {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 12,
    color: '#0f172a',
  },
  attachmentError: {
    display: 'block',
    marginTop: 6,
    fontSize: 11,
    color: '#b91c1c',
  },
  attachmentGrid: {
    marginTop: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 10,
  },
  attachmentItem: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: 6,
    background: '#f8fafc',
  },
  attachmentImage: {
    width: '100%',
    height: 90,
    objectFit: 'cover',
    borderRadius: 6,
    display: 'block',
    marginBottom: 6,
  },
  removeAttachmentButton: {
    width: '100%',
    border: '1px solid #fecaca',
    background: '#fff1f2',
    color: '#b91c1c',
    borderRadius: 6,
    fontSize: 11,
    padding: '5px 8px',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  button: {
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    padding: '11px 22px',
    minWidth: 160,
    boxShadow: '0 10px 20px -10px rgba(124, 58, 237, 0.65)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
  },
}
