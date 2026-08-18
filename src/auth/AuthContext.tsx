import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loginRequest, logoutRequest, meRequest } from '../api/auth'
import { logInfo } from '../api/logger'
import type { AuthUser } from '../types'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    meRequest()
      .then((authUser) => {
        if (!cancelled) setUser(authUser)
      })
      .catch(() => {
        // 401 on /auth/me/ is expected when unauthenticated; the response interceptor logs it.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const authUser = await loginRequest(username, password)
    logInfo('Login succeeded', username)
    setUser(authUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
      logInfo('Logout succeeded')
    } catch (error) {
      // Still clear local auth state so the UI returns to the login page.
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, logout, setUser }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
