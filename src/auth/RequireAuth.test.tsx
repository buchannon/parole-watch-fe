import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AuthUser } from '../types'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { RequireAuth, RequireSubscription } from './RequireAuth'

function authValue(user: AuthUser | null): AuthContextValue {
  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    refreshUser: vi.fn().mockResolvedValue(user),
  }
}

function renderRoute(value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>login-page</div>} />
          <Route path="/protected" element={<RequireAuth><div>protected-content</div></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function subscribedUser(is_subscribed: boolean): AuthUser {
  return {
    username: 'admin',
    email: 'admin@example.com',
    name: 'Admin',
    groups: ['Test Group'],
    group_settings: [{ name: 'Test Group', operating_state: 'TX', is_subscribed }],
    settings: {
      receive_email_alerts_for_offender_status_changes: true,
      receive_offender_summary_report: true,
    },
  }
}

function renderSubscription(value: AuthContextValue) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={['/offenders']}>
          <Routes>
            <Route element={<RequireSubscription />}>
              <Route path="/offenders" element={<div>offender-content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('RequireAuth', () => {
  it('renders children when authenticated', () => {
    renderRoute(
      authValue({
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        groups: ['Test Group'],
        group_settings: [],
        settings: {
          receive_email_alerts_for_offender_status_changes: true,
          receive_offender_summary_report: true,
        },
      }),
    )
    expect(screen.getByText('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', () => {
    renderRoute(authValue(null))
    expect(screen.getByText('login-page')).toBeInTheDocument()
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument()
  })
})

describe('RequireSubscription', () => {
  it('renders children when the group is subscribed', () => {
    renderSubscription(authValue(subscribedUser(true)))
    expect(screen.getByText('offender-content')).toBeInTheDocument()
    expect(screen.queryByText(/Your subscription is inactive/i)).not.toBeInTheDocument()
  })

  it('shows the paywall when the group is not subscribed', () => {
    renderSubscription(authValue(subscribedUser(false)))
    expect(screen.getByText('Your subscription is inactive')).toBeInTheDocument()
    expect(screen.queryByText('offender-content')).not.toBeInTheDocument()
  })
})
