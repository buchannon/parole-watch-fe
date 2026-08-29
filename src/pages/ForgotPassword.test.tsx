import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as passwordResetApi from '../api/passwordReset'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import ForgotPassword from './ForgotPassword'

vi.mock('../api/passwordReset', () => ({
  useRequestPasswordReset: vi.fn(),
}))

vi.mock('../components/Turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile" />,
}))

const mockUseRequestPasswordReset = vi.mocked(passwordResetApi.useRequestPasswordReset)

function mockMutation(): any {
  return { mutate: vi.fn(), isPending: false }
}

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  }
}

function renderForgotPassword() {
  const mutate = vi.fn()
  mockUseRequestPasswordReset.mockReturnValue({ ...mockMutation(), mutate })
  render(
    <AuthContext.Provider value={authValue()}>
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
  return { mutate }
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the email form and a link back to sign in', () => {
    renderForgotPassword()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })

  it('submits the email to the reset request mutation', async () => {
    const { mutate } = renderForgotPassword()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { email: 'jane@example.com' },
        expect.anything(),
      ),
    )
  })

  it('shows a sent confirmation on success', async () => {
    const { mutate } = renderForgotPassword()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await waitFor(() => expect(mutate).toHaveBeenCalled())
    mutate.mock.calls[0][1].onSuccess()
    await waitFor(() => expect(screen.getByText('Reset link sent')).toBeInTheDocument())
  })

  it('shows an error banner when the request fails', async () => {
    const { mutate } = renderForgotPassword()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))

    await waitFor(() => expect(mutate).toHaveBeenCalled())
    mutate.mock.calls[0][1].onError(new Error('boom'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
