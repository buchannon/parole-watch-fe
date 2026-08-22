import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser } from '../types'
import Login from './Login'

vi.mock('../components/Turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile" />,
}))

const authUser: AuthUser = {
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin',
  groups: ['Test Group'],
  group_settings: [],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
}

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn().mockResolvedValue(authUser),
    logout: vi.fn(),
    setUser: vi.fn(),
    refreshUser: vi.fn().mockResolvedValue(authUser),
    ...overrides,
  }
}

function renderLogin(value: AuthContextValue = authValue()) {
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
  return value
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form fields and sign-in button', () => {
    renderLogin()
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('submits credentials to login on submit', async () => {
    const value = renderLogin()
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(value.login).toHaveBeenCalledWith('alice', 'secret123', ''))
  })

  it('shows an error banner when login fails', async () => {
    const value = renderLogin(authValue({ login: vi.fn().mockRejectedValue(new Error('Login failed')) }))
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(value.login).toHaveBeenCalled()
  })
})
