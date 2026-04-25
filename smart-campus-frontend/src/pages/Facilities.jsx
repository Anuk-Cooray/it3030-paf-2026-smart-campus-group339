import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import FacilityForm from '../components/facilities/FacilityForm'
import FacilityList from '../components/facilities/FacilityList'
import {
  createFacility,
  deleteFacility,
  listFacilities,
  updateFacility,
  updateFacilityStatus,
} from '../api/facilities'

const DEFAULT_PAGE_SIZE = 8

const INITIAL_FILTERS = {
  type: '',
  status: '',
  capacity: '',
  minCapacity: '',
  location: '',
  page: 0,
  size: DEFAULT_PAGE_SIZE,
}

export default function Facilities() {
  const { user } = useAuth()
  const canManage = useMemo(() => ['ROLE_ADMIN', 'ROLE_STAFF'].includes(user?.role), [user?.role])

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [facilities, setFacilities] = useState([])
  const [pagination, setPagination] = useState({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalPages: 0,
    totalElements: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    const loadFacilities = async () => {
      setLoading(true)
      setError('')

      try {
        const params = {
          page: filters.page,
          size: filters.size,
        }

        if (filters.type) params.type = filters.type
        if (filters.status) params.status = filters.status
        if (filters.location.trim()) params.location = filters.location.trim()
        if (filters.capacity) params.capacity = Number(filters.capacity)
        if (filters.minCapacity) params.minCapacity = Number(filters.minCapacity)

        const response = await listFacilities(params)
        setFacilities(response?.content || [])
        setPagination({
          page: response?.number ?? 0,
          size: response?.size ?? filters.size,
          totalPages: response?.totalPages ?? 0,
          totalElements: response?.totalElements ?? 0,
        })
      } catch (fetchError) {
        setError(getErrorMessage(fetchError))
      } finally {
        setLoading(false)
      }
    }

    loadFacilities()
  }, [filters, refreshTick])

  const applyFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 0,
    }))
  }

  const clearFilters = () => {
    setSelectedFacility(null)
    setNotice('')
    setFilters(INITIAL_FILTERS)
  }

  const refreshData = () => setRefreshTick((prev) => prev + 1)

  const submitFacility = async (payload) => {
    if (!canManage) {
      setError('You do not have permission to manage facilities.')
      return
    }

    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      if (selectedFacility?.id) {
        await updateFacility(selectedFacility.id, payload)
        setNotice('Facility updated successfully.')
      } else {
        await createFacility(payload)
        setNotice('Facility created successfully.')
      }

      setSelectedFacility(null)
      refreshData()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  const editFacility = (facility) => {
    setSelectedFacility(facility)
    setNotice('')
    setError('')
  }

  const removeFacility = async (facility) => {
    if (!canManage) {
      setError('You do not have permission to delete facilities.')
      return
    }

    const confirmed = window.confirm(`Delete ${facility.name}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setError('')
      setNotice('')
      await deleteFacility(facility.id)
      setNotice('Facility deleted successfully.')

      if (selectedFacility?.id === facility.id) {
        setSelectedFacility(null)
      }

      refreshData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  const toggleStatus = async (facility) => {
    if (!canManage) {
      setError('You do not have permission to change facility status.')
      return
    }

    const nextStatus = facility.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE'

    try {
      setError('')
      setNotice('')
      await updateFacilityStatus(facility.id, nextStatus)
      setNotice(`Facility marked as ${nextStatus === 'ACTIVE' ? 'active' : 'out of service'}.`)
      refreshData()
    } catch (statusError) {
      setError(getErrorMessage(statusError))
    }
  }

  const changePage = (nextPage) => {
    setFilters((prev) => ({
      ...prev,
      page: nextPage,
    }))
  }

  return (
    <div style={pageContainer}>
      <div style={headerCard}>
        <div style={headerGlowOne} />
        <div style={headerGlowTwo} />
        <div style={headerGlowThree} />
        <div style={headerContent}>
          <div style={eyebrow}>Module A</div>
          <h1 style={h1}>Facilities & Assets Catalogue</h1>
          <p style={headerP}>
            Manage lecture halls, laboratories, meeting rooms, projectors, cameras, and shared campus
            assets.
          </p>
        </div>
      </div>

      <div style={statsRow}>
        <StatCard label="Visible Results" value={facilities.length} />
        <StatCard label="Total Catalogue" value={pagination.totalElements} />
        <StatCard label="Current Page" value={pagination.page + 1} />
      </div>

      {canManage && (
        <>
          <FacilityForm
            facility={selectedFacility}
            onSubmitFacility={submitFacility}
            onCancel={() => setSelectedFacility(null)}
            submitting={submitting}
            canManage={canManage}
            message={notice}
          />

          <div style={spacer} />
        </>
      )}

      <FacilityList
        facilities={facilities}
        loading={loading}
        error={error}
        filters={filters}
        onFilterChange={applyFilterChange}
        onClearFilters={clearFilters}
        onEdit={editFacility}
        onDelete={removeFacility}
        onToggleStatus={toggleStatus}
        canManage={canManage}
        pagination={pagination}
        onPageChange={changePage}
      />
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  )
}

function getErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.'
  const response = error.response
  if (response?.data) {
    if (typeof response.data === 'string') {
      return response.data
    }
    if (typeof response.data === 'object') {
      return response.data.message || response.data.error || 'The server rejected the request.'
    }
  }
  return error.message || 'An unexpected error occurred.'
}

const pageContainer = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '16px',
  display: 'grid',
  gap: 18,
}

const headerCard = {
  background:
    'linear-gradient(128deg, rgba(8, 47, 73, 0.98) 0%, rgba(15, 23, 42, 0.97) 38%, rgba(30, 58, 138, 0.96) 72%, rgba(37, 99, 235, 0.95) 100%)',
  backgroundImage:
    'radial-gradient(circle at 12% 18%, rgba(125, 211, 252, 0.28) 0%, rgba(125, 211, 252, 0) 36%), radial-gradient(circle at 82% 78%, rgba(147, 197, 253, 0.22) 0%, rgba(147, 197, 253, 0) 40%), linear-gradient(128deg, rgba(8, 47, 73, 0.98) 0%, rgba(15, 23, 42, 0.97) 38%, rgba(30, 58, 138, 0.96) 72%, rgba(37, 99, 235, 0.95) 100%)',
  color: 'white',
  borderRadius: 20,
  padding: 36,
  boxShadow: '0 16px 34px rgba(15, 23, 42, 0.42)',
  position: 'relative',
  overflow: 'hidden',
}

const headerContent = {
  position: 'relative',
  zIndex: 2,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const eyebrow = {
  display: 'inline-flex',
  padding: '5px 12px',
  borderRadius: 999,
  background: 'rgba(191, 219, 254, 0.18)',
  color: '#bfdbfe',
  border: '1px solid rgba(191, 219, 254, 0.32)',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.6px',
  textTransform: 'uppercase',
  marginBottom: 12,
}

const headerGlowOne = {
  position: 'absolute',
  width: 360,
  height: 360,
  borderRadius: '50%',
  top: -170,
  left: -80,
  background: 'rgba(125, 211, 252, 0.34)',
  filter: 'blur(64px)',
  zIndex: 0,
}

const headerGlowTwo = {
  position: 'absolute',
  width: 300,
  height: 300,
  borderRadius: '50%',
  bottom: -160,
  right: -30,
  background: 'rgba(96, 165, 250, 0.32)',
  filter: 'blur(58px)',
  zIndex: 0,
}

const headerGlowThree = {
  position: 'absolute',
  width: 240,
  height: 240,
  borderRadius: '50%',
  top: 40,
  right: 240,
  background: 'rgba(191, 219, 254, 0.22)',
  filter: 'blur(52px)',
  zIndex: 0,
}

const h1 = {
  margin: '0 0 12px 0',
  fontSize: 36,
  fontWeight: 800,
  letterSpacing: '-0.5px',
  position: 'relative',
  zIndex: 2,
}

const headerP = {
  margin: 0,
  fontSize: 16,
  opacity: 0.95,
  lineHeight: 1.6,
  fontWeight: 500,
  position: 'relative',
  zIndex: 2,
  maxWidth: 760,
}

const statsRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
}

const statCard = {
  background: '#ffffff',
  border: '1px solid #dbeafe',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.06)',
}

const statLabel = {
  fontSize: 13,
  fontWeight: 700,
  color: '#64748b',
  marginBottom: 6,
}

const statValue = {
  fontSize: 24,
  fontWeight: 800,
  color: '#0f172a',
}

const spacer = { height: 2 }
