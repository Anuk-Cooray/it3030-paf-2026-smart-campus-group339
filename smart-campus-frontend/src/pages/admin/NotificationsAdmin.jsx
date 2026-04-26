import { useEffect, useState } from 'react'
import { http } from '../../api/http.js'

const emptyForm = {
  userId: '',
  email: '',
  studentId: '',
  message: '',
}

export default function NotificationsAdmin() {
  const [notifications, setNotifications] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editMessage, setEditMessage] = useState('')
  const [editRead, setEditRead] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function loadNotifications() {
    setLoading(true)
    setError(null)
    try {
      const res = await http.get('/api/notifications/admin')
      setNotifications(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function createNotification(e) {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        userId: form.userId ? Number(form.userId) : null,
        email: form.email.trim() || null,
        studentId: form.studentId.trim() || null,
        message: form.message.trim(),
      }
      const res = await http.post('/api/notifications/admin', payload)
      setNotifications((prev) => [res.data, ...prev])
      setForm(emptyForm)
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  function startEdit(notification) {
    setEditingId(notification.id)
    setEditMessage(notification.message || '')
    setEditRead(Boolean(notification.read))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditMessage('')
    setEditRead(false)
  }

  async function saveEdit(id) {
    setError(null)
    try {
      const res = await http.put(`/api/notifications/admin/${id}`, {
        message: editMessage.trim(),
        read: editRead,
      })
      setNotifications((prev) => prev.map((item) => (item.id === id ? res.data : item)))
      cancelEdit()
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  async function deleteNotification(id) {
    if (!window.confirm('Delete this notification?')) return
    setError(null)
    try {
      await http.delete(`/api/notifications/admin/${id}`)
      setNotifications((prev) => prev.filter((item) => item.id !== id))
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data || e?.message || String(e))
    }
  }

  return (
    <div>
      <div style={header}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Notification Management</h2>
        <p style={sub}>Create, update, and delete user notifications from the admin console.</p>
      </div>

      {error ? <div style={errorBox}>{String(error)}</div> : null}

      <form onSubmit={createNotification} style={card}>
        <h3 style={h3}>Create Notification</h3>
        <div style={formGrid}>
          <label style={label}>
            User ID
            <input
              type="number"
              value={form.userId}
              onChange={(e) => updateForm('userId', e.target.value)}
              placeholder="e.g. 1"
              style={input}
            />
          </label>
          <label style={label}>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="student@example.com"
              style={input}
            />
          </label>
          <label style={label}>
            Student ID
            <input
              type="text"
              value={form.studentId}
              onChange={(e) => updateForm('studentId', e.target.value)}
              placeholder="IT23328020"
              style={input}
            />
          </label>
        </div>
        <label style={{ ...label, marginTop: 12 }}>
          Message
          <textarea
            value={form.message}
            onChange={(e) => updateForm('message', e.target.value)}
            placeholder="Type notification message"
            rows={3}
            required
            style={textarea}
          />
        </label>
        <button type="submit" style={primaryBtn}>
          Create Notification
        </button>
      </form>

      <div style={{ ...card, marginTop: 14 }}>
        <div style={tableHeader}>
          <h3 style={h3}>All Notifications</h3>
          <button type="button" onClick={loadNotifications} disabled={loading} style={secondaryBtn}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>User</th>
                <th style={th}>Message</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => {
                const isEditing = editingId === notification.id
                return (
                  <tr key={notification.id}>
                    <td style={td}>
                      <strong>{notification.userName || 'Unknown'}</strong>
                      <div style={muted}>{notification.userEmail || `User #${notification.userId}`}</div>
                    </td>
                    <td style={td}>
                      {isEditing ? (
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          style={textarea}
                        />
                      ) : (
                        notification.message
                      )}
                    </td>
                    <td style={td}>
                      {isEditing ? (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={editRead}
                            onChange={(e) => setEditRead(e.target.checked)}
                          />
                          Read
                        </label>
                      ) : (
                        <span style={notification.read ? readBadge : unreadBadge}>
                          {notification.read ? 'Read' : 'Unread'}
                        </span>
                      )}
                    </td>
                    <td style={td}>{notification.createdAt ? String(notification.createdAt) : '-'}</td>
                    <td style={td}>
                      {isEditing ? (
                        <div style={actions}>
                          <button type="button" onClick={() => saveEdit(notification.id)} style={primarySmallBtn}>
                            Save
                          </button>
                          <button type="button" onClick={cancelEdit} style={secondaryBtn}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={actions}>
                          <button type="button" onClick={() => startEdit(notification)} style={secondaryBtn}>
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteNotification(notification.id)} style={dangerBtn}>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...td, color: '#64748b' }}>
                    No notifications found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const header = { marginBottom: 14 }
const sub = { margin: '6px 0 0', color: '#64748b' }
const card = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}
const h3 = { margin: 0, color: '#111827' }
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 12 }
const label = { display: 'grid', gap: 6, color: '#334155', fontSize: 13, fontWeight: 700 }
const input = { border: '1px solid #cbd5e1', borderRadius: 10, padding: 10, font: 'inherit' }
const textarea = { border: '1px solid #cbd5e1', borderRadius: 10, padding: 10, font: 'inherit', width: '100%' }
const primaryBtn = {
  marginTop: 12,
  border: 'none',
  borderRadius: 10,
  background: '#2563eb',
  color: '#fff',
  padding: '10px 14px',
  fontWeight: 800,
  cursor: 'pointer',
}
const primarySmallBtn = { ...primaryBtn, marginTop: 0, padding: '8px 10px' }
const secondaryBtn = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  background: '#fff',
  color: '#334155',
  padding: '8px 10px',
  fontWeight: 700,
  cursor: 'pointer',
}
const dangerBtn = { ...secondaryBtn, borderColor: '#fecaca', color: '#b91c1c' }
const errorBox = {
  marginBottom: 10,
  color: '#b91c1c',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: 10,
  borderRadius: 8,
}
const tableHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
const table = { width: '100%', borderCollapse: 'collapse' }
const th = { textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', color: '#475569', fontSize: 12 }
const td = { padding: 10, borderBottom: '1px solid #f1f5f9', verticalAlign: 'top', color: '#0f172a' }
const muted = { color: '#64748b', fontSize: 12, marginTop: 4 }
const actions = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const unreadBadge = { color: '#92400e', background: '#fef3c7', borderRadius: 999, padding: '4px 8px', fontSize: 12 }
const readBadge = { color: '#166534', background: '#dcfce7', borderRadius: 999, padding: '4px 8px', fontSize: 12 }
