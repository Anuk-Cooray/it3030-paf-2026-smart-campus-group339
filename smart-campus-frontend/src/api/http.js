import axios from 'axios'

export const TOKEN_KEY = 'smartcampus.jwt'

export const http = axios.create({
  baseURL: '/api',
})

function readHeader(headers, name) {
  if (!headers) return null
  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(name.toLowerCase())
  }
  return headers[name] || headers[name.toLowerCase()]
}

http.interceptors.request.use((config) => {
  const h = config.headers
  if (readHeader(h, 'Authorization')) {
    return config
  }

  const token = sessionStorage.getItem(TOKEN_KEY)
  if (!token) {
    return config
  }

  const value = `Bearer ${token}`
  if (h && typeof h.set === 'function') {
    h.set('Authorization', value)
  } else if (h && typeof h === 'object') {
    h.Authorization = value
  } else {
    config.headers = { Authorization: value }
  }
  return config
})
