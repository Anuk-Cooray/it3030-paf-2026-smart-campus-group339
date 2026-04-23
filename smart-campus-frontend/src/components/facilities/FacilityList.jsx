const TYPE_LABELS = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  PROJECTOR: 'Projector',
  CAMERA: 'Camera',
  OTHER: 'Other',
}

const STATUS_LABELS = {
  ACTIVE: 'Active',
  OUT_OF_SERVICE: 'Out of Service',
}

export default function FacilityList({
  facilities,
  loading,
  error,
  filters,
  onFilterChange,
  onClearFilters,
  onEdit,
  onDelete,
  onToggleStatus,
  canManage,
  pagination,
  onPageChange,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>Facilities Catalogue</h3>
          <p style={styles.subtitle}>Search and filter campus rooms, labs, lecture halls, and equipment.</p>
        </div>
        <div style={styles.summaryPill}>
          {pagination.totalElements} total {pagination.totalElements === 1 ? 'item' : 'items'}
        </div>
      </div>

      <div style={styles.filterGrid}>
        <FilterField label="Type">
          <select value={filters.type} onChange={(event) => onFilterChange('type', event.target.value)} style={styles.input}>
            <option value="">All Types</option>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="LAB">Lab</option>
            <option value="MEETING_ROOM">Meeting Room</option>
            <option value="PROJECTOR">Projector</option>
            <option value="CAMERA">Camera</option>
            <option value="OTHER">Other</option>
          </select>
        </FilterField>

        <FilterField label="Status">
          <select value={filters.status} onChange={(event) => onFilterChange('status', event.target.value)} style={styles.input}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </FilterField>

        <FilterField label="Exact Capacity">
          <input
            type="number"
            min="1"
            value={filters.capacity}
            onChange={(event) => onFilterChange('capacity', event.target.value)}
            placeholder="e.g. 60"
            style={styles.input}
          />
        </FilterField>

        <FilterField label="Min Capacity">
          <input
            type="number"
            min="1"
            value={filters.minCapacity}
            onChange={(event) => onFilterChange('minCapacity', event.target.value)}
            placeholder="e.g. 30"
            style={styles.input}
          />
        </FilterField>

        <FilterField label="Location">
          <input
            value={filters.location}
            onChange={(event) => onFilterChange('location', event.target.value)}
            placeholder="Building, floor, block"
            style={styles.input}
          />
        </FilterField>

        <div style={styles.filterActions}>
          <button type="button" onClick={onClearFilters} style={styles.secondaryButton}>
            Clear Filters
          </button>
        </div>
      </div>

      {loading && <div style={styles.feedback}>Loading facilities...</div>}
      {!loading && error && <div style={styles.error}>{error}</div>}
      {!loading && !error && facilities.length === 0 && <div style={styles.feedback}>No facilities found.</div>}

      {!loading && facilities.length > 0 && (
        <div style={styles.grid}>
          {facilities.map((facility) => (
            <div key={facility.id} style={styles.cardItem}>
              <div style={styles.cardHeader}>
                <div>
                  <h4 style={styles.itemTitle}>{facility.name}</h4>
                  <p style={styles.itemLocation}>📍 {facility.location}</p>
                </div>
                <div style={styles.badgeGroup}>
                  <span style={styles.typeBadge}>{TYPE_LABELS[facility.type] || facility.type}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: facility.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                      color: facility.status === 'ACTIVE' ? '#166534' : '#991b1b',
                    }}
                  >
                    {STATUS_LABELS[facility.status] || facility.status}
                  </span>
                </div>
              </div>

              <div style={styles.statsRow}>
                <Stat label="Capacity" value={facility.capacity} />
                <Stat label="Availability Slots" value={facility.availabilityWindows?.length || 0} />
              </div>

              <div style={styles.availabilityBlock}>
                <div style={styles.availabilityTitle}>Weekly Availability</div>
                <div style={styles.windowWrap}>
                  {(facility.availabilityWindows || []).map((window, index) => (
                    <span key={`${facility.id}-window-${index}`} style={styles.windowChip}>
                      {window.dayOfWeek} {formatTime(window.startTime)} - {formatTime(window.endTime)}
                    </span>
                  ))}
                </div>
              </div>

              {canManage && (
                <div style={styles.actionsRow}>
                  <button type="button" onClick={() => onEdit(facility)} style={styles.secondaryButton}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(facility)}
                    style={styles.statusButton}
                  >
                    {facility.status === 'ACTIVE' ? 'Mark Out of Service' : 'Mark Active'}
                  </button>
                  <button type="button" onClick={() => onDelete(facility)} style={styles.dangerButton}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div style={styles.paginationRow}>
          <button
            type="button"
            disabled={pagination.page <= 0}
            onClick={() => onPageChange(pagination.page - 1)}
            style={styles.secondaryButton}
          >
            Previous
          </button>
          <div style={styles.pageInfo}>
            Page {pagination.page + 1} of {pagination.totalPages}
          </div>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => onPageChange(pagination.page + 1)}
            style={styles.secondaryButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function FilterField({ label, children }) {
  return (
    <label style={styles.filterField}>
      <span style={styles.filterLabel}>{label}</span>
      {children}
    </label>
  )
}

function Stat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  )
}

function formatTime(value) {
  if (!value) return '--'
  const text = String(value)
  return text.length >= 5 ? text.slice(0, 5) : text
}

const styles = {
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: 22,
    boxShadow: '0 14px 32px rgba(15, 23, 42, 0.08)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#475569',
  },
  summaryPill: {
    padding: '8px 12px',
    borderRadius: 999,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 18,
    alignItems: 'end',
  },
  filterField: {
    display: 'grid',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
  },
  input: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    fontSize: 14,
    color: '#0f172a',
    background: '#ffffff',
    boxSizing: 'border-box',
  },
  filterActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dangerButton: {
    border: '1px solid #fecaca',
    background: '#fff1f2',
    color: '#991b1b',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  statusButton: {
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  feedback: {
    padding: '18px 0',
    color: '#475569',
    textAlign: 'center',
  },
  error: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#991b1b',
    marginBottom: 14,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
  },
  cardItem: {
    background: '#f8fbff',
    border: '1px solid #dbeafe',
    borderRadius: 18,
    padding: 18,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  itemTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
  },
  itemLocation: {
    margin: '6px 0 0 0',
    color: '#475569',
  },
  badgeGroup: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  typeBadge: {
    padding: '5px 10px',
    borderRadius: 999,
    background: '#dbeafe',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: 700,
  },
  statusBadge: {
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: 700,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
  },
  availabilityBlock: {
    borderRadius: 14,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: 14,
    marginBottom: 14,
  },
  availabilityTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 10,
  },
  windowWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  windowChip: {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: 700,
  },
  actionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  pageInfo: {
    fontWeight: 700,
    color: '#0f172a',
  },
}