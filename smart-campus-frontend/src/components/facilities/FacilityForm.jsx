import { useEffect, useMemo, useState } from 'react'

const TYPE_OPTIONS = [
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'PROJECTOR', label: 'Projector' },
  { value: 'CAMERA', label: 'Camera' },
  { value: 'OTHER', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
]

const DAY_OPTIONS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const DEFAULT_WINDOW = { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00' }

function toTimeInputValue(value) {
  if (!value) return ''
  const normalized = String(value)
  return normalized.length >= 5 ? normalized.slice(0, 5) : normalized
}

function createInitialForm(facility) {
  if (!facility) {
    return {
      name: '',
      type: 'LECTURE_HALL',
      capacity: '',
      location: '',
      status: 'ACTIVE',
      availabilityWindows: [DEFAULT_WINDOW],
    }
  }

  return {
    name: facility.name || '',
    type: facility.type || 'LECTURE_HALL',
    capacity: facility.capacity ?? '',
    location: facility.location || '',
    status: facility.status || 'ACTIVE',
    availabilityWindows:
      facility.availabilityWindows?.length > 0
        ? facility.availabilityWindows.map((window) => ({
            dayOfWeek: window.dayOfWeek || 'MONDAY',
            startTime: toTimeInputValue(window.startTime),
            endTime: toTimeInputValue(window.endTime),
          }))
        : [DEFAULT_WINDOW],
  }
}

export default function FacilityForm({
  facility,
  onSubmitFacility,
  onCancel,
  submitting,
  canManage,
  message,
}) {
  const [formData, setFormData] = useState(() => createInitialForm(facility))
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setFormData(createInitialForm(facility))
    setLocalError('')
  }, [facility])

  const isEditing = Boolean(facility?.id)
  const heading = useMemo(
    () => (isEditing ? 'Edit Facility / Asset' : 'Add Facility / Asset'),
    [isEditing],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const updateWindow = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availabilityWindows: prev.availabilityWindows.map((window, windowIndex) =>
        windowIndex === index ? { ...window, [field]: value } : window,
      ),
    }))
  }

  const addWindow = () => {
    setFormData((prev) => ({
      ...prev,
      availabilityWindows: [...prev.availabilityWindows, DEFAULT_WINDOW],
    }))
  }

  const removeWindow = (index) => {
    setFormData((prev) => {
      const nextWindows = prev.availabilityWindows.filter((_, windowIndex) => windowIndex !== index)
      return {
        ...prev,
        availabilityWindows: nextWindows.length > 0 ? nextWindows : [DEFAULT_WINDOW],
      }
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (!canManage) {
      setLocalError('You do not have permission to manage facilities.')
      return
    }

    if (!formData.name.trim() || !formData.location.trim()) {
      setLocalError('Name and location are required.')
      return
    }

    const capacityValue = Number.parseInt(formData.capacity, 10)
    if (!Number.isInteger(capacityValue) || capacityValue <= 0) {
      setLocalError('Capacity must be a positive number.')
      return
    }

    const cleanedWindows = formData.availabilityWindows
      .map((window) => ({
        dayOfWeek: window.dayOfWeek,
        startTime: window.startTime,
        endTime: window.endTime,
      }))
      .filter((window) => window.dayOfWeek && window.startTime && window.endTime)

    if (cleanedWindows.length === 0) {
      setLocalError('Add at least one availability window.')
      return
    }

    const hasInvalidWindow = cleanedWindows.some((window) => window.startTime >= window.endTime)
    if (hasInvalidWindow) {
      setLocalError('Availability start time must be before end time.')
      return
    }

    await onSubmitFacility({
      name: formData.name.trim(),
      type: formData.type,
      capacity: capacityValue,
      location: formData.location.trim(),
      status: formData.status,
      availabilityWindows: cleanedWindows,
    })
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>Catalogue Manager</div>
          <h2 style={styles.title}>{heading}</h2>
          <p style={styles.subtitle}>
            Maintain lecture halls, labs, meeting rooms, and shared equipment.
          </p>
        </div>
        {!canManage && <div style={styles.lockedNote}>View-only access</div>}
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {localError && <div style={styles.error}>{localError}</div>}

      <form onSubmit={submit} style={styles.form}>
        <div style={styles.gridTwo}>
          <Field label="Name" required>
            <input name="name" value={formData.name} onChange={handleChange} style={styles.input} />
          </Field>
          <Field label="Location" required>
            <input name="location" value={formData.location} onChange={handleChange} style={styles.input} />
          </Field>
        </div>

        <div style={styles.gridThree}>
          <Field label="Type" required>
            <select name="type" value={formData.type} onChange={handleChange} style={styles.input}>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Capacity" required>
            <input
              type="number"
              min="1"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              style={styles.input}
            />
          </Field>

          <Field label="Status">
            <select name="status" value={formData.status} onChange={handleChange} style={styles.input}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={styles.windowSection}>
          <div style={styles.windowHeader}>
            <div>
              <h3 style={styles.windowTitle}>Weekly Availability</h3>
              <p style={styles.windowText}>Use weekly recurring windows only.</p>
            </div>
            <button type="button" onClick={addWindow} style={styles.secondaryButton}>
              Add Window
            </button>
          </div>

          <div style={styles.windowList}>
            {formData.availabilityWindows.map((window, index) => (
              <div key={`${window.dayOfWeek}-${index}`} style={styles.windowRow}>
                <Field label="Day">
                  <select
                    value={window.dayOfWeek}
                    onChange={(event) => updateWindow(index, 'dayOfWeek', event.target.value)}
                    style={styles.input}
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Start Time">
                  <input
                    type="time"
                    value={window.startTime}
                    onChange={(event) => updateWindow(index, 'startTime', event.target.value)}
                    style={styles.input}
                  />
                </Field>
                <Field label="End Time">
                  <input
                    type="time"
                    value={window.endTime}
                    onChange={(event) => updateWindow(index, 'endTime', event.target.value)}
                    style={styles.input}
                  />
                </Field>
                <div style={styles.removeColumn}>
                  <button type="button" onClick={() => removeWindow(index)} style={styles.dangerButton}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.buttonRow}>
          {isEditing && (
            <button type="button" onClick={onCancel} style={styles.secondaryButton}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={submitting || !canManage} style={styles.primaryButton}>
            {submitting ? 'Saving...' : isEditing ? 'Update Facility' : 'Create Facility'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label} {required && <span style={styles.required}>*</span>}
      </span>
      {children}
    </label>
  )
}

const styles = {
  card: {
    background: '#ffffff',
    border: '1px solid #dbeafe',
    borderRadius: 20,
    padding: 22,
    boxShadow: '0 14px 32px rgba(15, 23, 42, 0.09)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  badge: {
    display: 'inline-flex',
    padding: '5px 10px',
    borderRadius: 999,
    background: '#eef6ff',
    color: '#0f4aa8',
    border: '1px solid #cfe0ff',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.4px',
    marginBottom: 10,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#475569',
    lineHeight: 1.5,
  },
  lockedNote: {
    borderRadius: 999,
    padding: '8px 12px',
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  success: {
    marginBottom: 14,
    padding: '12px 14px',
    borderRadius: 12,
    background: '#ecfdf5',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  error: {
    marginBottom: 14,
    padding: '12px 14px',
    borderRadius: 12,
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  form: {
    display: 'grid',
    gap: 18,
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
  },
  gridThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,
  },
  field: {
    display: 'grid',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    padding: '11px 12px',
    fontSize: 14,
    color: '#0f172a',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  windowSection: {
    borderRadius: 16,
    background: '#f8fbff',
    border: '1px solid #dbeafe',
    padding: 16,
  },
  windowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  windowTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
  },
  windowText: {
    margin: '4px 0 0 0',
    color: '#475569',
    fontSize: 13,
  },
  windowList: {
    display: 'grid',
    gap: 12,
  },
  windowRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr auto',
    gap: 12,
    alignItems: 'end',
  },
  removeColumn: {
    display: 'flex',
    alignItems: 'center',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #0f4aa8 0%, #2563eb 100%)',
    color: '#ffffff',
    padding: '12px 18px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(37, 99, 235, 0.24)',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    background: '#ffffff',
    color: '#0f172a',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dangerButton: {
    border: '1px solid #fecaca',
    borderRadius: 12,
    background: '#fff1f2',
    color: '#991b1b',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}