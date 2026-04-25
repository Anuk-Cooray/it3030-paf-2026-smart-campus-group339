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



const spacer = { height: 2 }
