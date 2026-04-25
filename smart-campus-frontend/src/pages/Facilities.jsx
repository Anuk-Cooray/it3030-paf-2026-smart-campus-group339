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




const spacer = { height: 2 }
