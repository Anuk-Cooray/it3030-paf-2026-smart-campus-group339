import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TOKEN_KEY } from './api/http'

const USER_KEY = 'smartcampus.user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY)
    const storedUser = sessionStorage.getItem(USER_KEY)
    if (storedToken) setToken(storedToken)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        sessionStorage.removeItem(USER_KEY)
      }
    }
  }, [])

  const login = useCallback((nextUser, nextToken) => {
    if (!nextToken) {
      throw new Error('Missing token from backend response')
    }

    sessionStorage.setItem(TOKEN_KEY, nextToken)
    sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser || {}))

    setToken(nextToken)
    setUser(nextUser || null)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  /** Merge server `User` JSON (uses numeric `id`) into session user (`userId`). */
  const updateUser = useCallback((apiUser) => {
    if (!apiUser) return
    setUser((prev) => {
      const next = {
        ...(prev || {}),
        userId: apiUser.id ?? prev?.userId,
        email: apiUser.email ?? prev?.email,
        name: apiUser.name ?? prev?.name,
        role: apiUser.role ?? prev?.role,
        studentId: apiUser.studentId ?? prev?.studentId ?? null,
        authProvider: apiUser.authProvider ?? prev?.authProvider ?? null,
        mobileNumber: apiUser.mobileNumber ?? prev?.mobileNumber ?? null,
        profilePicture: apiUser.profilePicture ?? prev?.profilePicture ?? null,
        needsProfileSetup: prev?.needsProfileSetup ?? false,
      }
      sessionStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
      updateUser,
    }),
    [user, token, login, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
