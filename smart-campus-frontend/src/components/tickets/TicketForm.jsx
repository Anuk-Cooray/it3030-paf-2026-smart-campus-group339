import { useState } from 'react'
import { useAuth } from '../../AuthContext'

export default function TicketForm({ onTicketCreated }) {
  const { authToken } = useAuth()
  const [formData, setFormData] = useState({
    resource: '',
    location: '',
    category: 'electrical',
    description: '',
    priority: 'medium',
    contactDetails: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!authToken) {
      setMessage({ type: 'error', text: 'Please log in first' })
      return
    }

    setLoading(true)
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
        throw new Error('Failed to create ticket')
      }

      setMessage({ type: 'success', text: 'Ticket created successfully!' })
      setFormData({
        resource: '',
        location: '',
        category: 'electrical',
        description: '',
        priority: 'medium',
        contactDetails: '',
      })

      if (onTicketCreated) {
        onTicketCreated()
      }

      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Create New Maintenance Ticket</h3>

      {message && (
        <div style={{
          ...styles.alert,
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Resource/Equipment *</label>
          <input
            type="text"
            name="resource"
            value={formData.resource}
            onChange={handleChange}
            placeholder="e.g., Air Conditioner, Water Pump"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Location *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Building A, Room 201"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.formGroup, flex: 1, marginRight: 16 }}>
            <label style={styles.label}>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required style={styles.input}>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="hvac">HVAC/Cooling</option>
              <option value="structural">Structural</option>
              <option value="cleaning">Cleaning</option>
              <option value="security">Security</option>
              <option value="it">IT/Network</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ ...styles.formGroup, flex: 1 }}>
            <label style={styles.label}>Priority *</label>
            <select name="priority" value={formData.priority} onChange={handleChange} required style={styles.input}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide details about the issue..."
            rows={4}
            style={styles.textarea}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Preferred Contact Details</label>
          <input
            type="text"
            name="contactDetails"
            value={formData.contactDetails}
            onChange={handleChange}
            placeholder="e.g., Phone number or email"
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading || !authToken} style={styles.button}>
          {loading ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  title: {
    margin: '0 0 16px 0',
    color: '#111827',
    fontSize: 18,
    fontWeight: 600,
  },
  alert: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit',
  },
  row: {
    display: 'flex',
    gap: 16,
  },
  button: {
    padding: '12px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 8,
  },
}
