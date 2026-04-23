export default function AdminBookingsPlaceholder() {
  return (
    <div style={card}>
      <h2 style={h2}>Bookings Admin</h2>
      <p style={p}>Placeholder page for Bookings administration.</p>
    </div>
  )
}

const card = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 18,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}
const h2 = { margin: 0, marginBottom: 8, color: '#111827' }
const p = { margin: 0, color: '#4b5563', lineHeight: 1.5 }
