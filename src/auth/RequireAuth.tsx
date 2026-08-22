import { Navigate, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { isSubscribed } from './subscription'
import { Spinner } from '../components/Spinner'
import Paywall from '../pages/Paywall'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Spinner label="Loading…" />
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export function RequireSubscription() {
  const { user } = useAuth()

  if (!isSubscribed(user)) {
    return <Paywall />
  }
  return <Outlet />
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/offenders" replace />
  }
  return <>{children}</>
}
