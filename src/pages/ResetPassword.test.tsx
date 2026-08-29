import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as passwordResetApi from '../api/passwordReset'
import { useAuth } from '../auth/AuthContext'
import type { AuthUser } from '../types'
import ResetPassword from './ResetPassword'

vi.mock('../api/passwordReset', () => ({
  useResetPassword: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../components/Turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile" />,
}))

const navigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

const mockUseResetPassword = vi.mocked(passwordResetApi.useResetPassword)
const mockUseAuth = vi.mocked(useAuth)

const authUser: AuthUser = {
  username: 'jane@example.com',
  email: 'jane@example.com',
  name: 'Jane Doe',
  groups: ['Doe & Associates'],
  group_settings: [{ name: 'Doe & Associates', operating_state: 'TX', is_subscribed: false }],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
}

const PASSWORD = 'BrandNew!Pass9'

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }
}

function renderResetPassword(initialEntries: string[] = ['/reset-password?email=jane%40example.com&token=abc123']) {
  const mutate = vi.fn()
  const setUser = vi.fn()
  mockUseResetPassword.mockReturnValue({ ...mockMutation(), mutate })
  mockUseAuth.mockReturnValue({ setUser } as any)
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <ResetPassword />
    </MemoryRouter>,
  )
  return { mutate, setUser }
}

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to forgot-password when email or token is missing', () => {
    renderResetPassword(['/reset-password'])
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument()
  })

  it('renders the new-password form', () => {
    renderResetPassword()
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeInTheDocument()
  })

  it('blocks submit with a weak password', async () => {
    const { mutate } = renderResetPassword()
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'weak' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() => expect(mutate).not.toHaveBeenCalled())
    expect(screen.getByText(/stronger password/)).toBeInTheDocument()
  })

  it('blocks submit when passwords do not match', async () => {
    const { mutate } = renderResetPassword()
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Different!Pass1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() => expect(mutate).not.toHaveBeenCalled())
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('submits email, token, and password to the confirm mutation', async () => {
    const { mutate } = renderResetPassword()
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { email: 'jane@example.com', token: 'abc123', password: PASSWORD },
        expect.anything(),
      ),
    )
  })

  it('auto-logs the user in and navigates to the app on success', async () => {
    const { mutate, setUser } = renderResetPassword()
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() => expect(mutate).toHaveBeenCalled())
    mutate.mock.calls[0][1].onSuccess(authUser)

    expect(setUser).toHaveBeenCalledWith(authUser)
    expect(navigate).toHaveBeenCalledWith('/offenders', { replace: true })
  })

  it('shows an error banner when the confirm fails', async () => {
    const { mutate } = renderResetPassword()
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))

    await waitFor(() => expect(mutate).toHaveBeenCalled())
    mutate.mock.calls[0][1].onError(new Error('boom'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
