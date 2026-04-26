import axios from 'axios'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

function notificationsBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (!raw) return '/api/notifications'
  const base = String(raw).replace(/\/$/, '')
  return `${base}/api/notifications`
}

function websocketBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  const base = raw ? String(raw).replace(/\/$/, '') : 'http://localhost:8080'
  return `${base}/ws`
}

export function NotificationBell() {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const rootRef = useRef(null)
  const tokenRef = useRef(token)
  tokenRef.current = token

  const notificationsApi = useMemo(() => {
    const client = axios.create({ baseURL: notificationsBaseUrl() })
    client.interceptors.request.use((config) => {
      const t = tokenRef.current
      if (t) config.headers.Authorization = `Bearer ${t}`
      return config
    })
    return client
  }, [])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  async function refresh() {
    setError(null)
    setLoading(true)
    try {
      const res = await notificationsApi.get('/')
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setError(e?.response?.data || e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    refresh()
  }, [token])

  useEffect(() => {
    if (!token) return undefined

    const client = new Client({
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS(websocketBaseUrl()),
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message) => {
          try {
            const next = JSON.parse(message.body)
            setItems((prev) => {
              if (prev.some((item) => item.id === next.id)) {
                return prev
              }
              return [next, ...prev]
            })
          } catch (e) {
            setError(e?.message || String(e))
          }
        })
      },
      onStompError: (frame) => {
        setError(frame.headers?.message || frame.body || 'Notification socket error')
      },
      onWebSocketError: () => {
        setError('Notification socket connection failed')
      },
    })

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [token])

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!open) return
      const el = rootRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  async function markRead(id) {
    setError(null)
    try {
      await notificationsApi.patch(`/${id}/read`)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (e) {
      setError(e?.response?.data || e?.message || String(e))
    }
  }

  async function remove(id) {
    setError(null)
    try {
      await notificationsApi.delete(`/${id}`)
      setItems((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      setError(e?.response?.data || e?.message || String(e))
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={bellBtn} aria-label="Notifications">
        <span style={{ fontSize: 18 }}>🔔</span>
        {unreadCount > 0 ? <span style={badge}>{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div style={panel}>
          <div style={panelHeader}>
            <div style={{ fontWeight: 800, color: '#111827' }}>Notifications</div>
            <button type="button" onClick={refresh} disabled={loading} style={miniBtn}>
              Refresh
            </button>
          </div>

          {error ? <pre style={errorBox}>{String(error)}</pre> : null}

          {items.length === 0 && !loading ? (
            <div style={{ color: '#6b7280', padding: 10 }}>No notifications yet.</div>
          ) : null}

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 380, overflow: 'auto' }}>
            {items.map((n) => (
              <li key={n.id} style={{ borderTop: '1px solid #eef2f7' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) markRead(n.id)
                    }}
                    style={{
                      textAlign: 'left',
                      border: 'none',
                      background: n.read ? '#ffffff' : '#f0f9ff',
                      borderRadius: 10,
                      padding: 10,
                      cursor: n.read ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, color: '#111827', fontWeight: 650 }}>{n.message}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                      {n.read ? 'Read' : 'Unread'}
                      {n.createdAt ? ` · ${String(n.createdAt)}` : ''}
                    </div>
                  </button>

                  <button type="button" onClick={() => remove(n.id)} style={trashBtn} aria-label="Delete notification">
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

const bellBtn = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  cursor: 'pointer',
}

const badge = {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 999,
  background: '#ef4444',
  color: 'white',
  fontSize: 11,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #ffffff',
}

const panel = {
  position: 'absolute',
  right: 0,
  marginTop: 10,
  width: 380,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 18px 40px rgba(0,0,0,0.12)',
  overflow: 'hidden',
  zIndex: 50,
}

const panelHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 12,
  borderBottom: '1px solid #eef2f7',
  background: '#ffffff',
}

const miniBtn = {
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  borderRadius: 10,
  padding: '6px 10px',
  cursor: 'pointer',
  fontWeight: 700,
}

const trashBtn = {
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  borderRadius: 10,
  width: 40,
  cursor: 'pointer',
}

const errorBox = {
  margin: 0,
  padding: 10,
  color: '#b91c1c',
  whiteSpace: 'pre-wrap',
  borderBottom: '1px solid #fee2e2',
  background: '#fff1f2',
}
