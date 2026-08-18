import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { AuthUser } from '../types'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { RequireAuth } from './RequireAuth'

function authValue(user: AuthUser | null): AuthContextValue {
  return { user, isAuthenticated: Boolean(user), isLoading: false, login: vi.fn(), logout: vi.fn(), setUser: vi.fn() }
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

describe('RequireAuth', () => {
  it('renders children when authenticated', () => {
    renderRoute(authValue({ username: 'admin', email: 'admin@example.com' }))
    expect(screen.getByText('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', () => {
    renderRoute(authValue(null))
    expect(screen.getByText('login-page')).toBeInTheDocument()
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument()
  })
})
