import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as signupApi from '../api/signup'
import { useAuth } from '../auth/AuthContext'
import type { AuthUser } from '../types'
import Signup from './Signup'

vi.mock('../api/signup', () => ({
  useSignup: vi.fn(),
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

const mockUseSignup = vi.mocked(signupApi.useSignup)
const mockUseAuth = vi.mocked(useAuth)

const authUser: AuthUser = {
  username: 'jane@example.com',
  email: 'jane@example.com',
  name: 'Jane Doe',
  groups: ['Doe & Associates'],
  group_settings: [{ name: 'Doe & Associates', operating_state: 'TX' }],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
}

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isSuccess: false, error: null }
}

function renderSignup() {
  const mutate = vi.fn()
  const setUser = vi.fn()
  mockUseSignup.mockReturnValue({ ...mockMutation(), mutate })
  mockUseAuth.mockReturnValue({ setUser } as any)
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>,
  )
  return { mutate, setUser }
}

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the headline, benefits list, and form fields', () => {
    renderSignup()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Law firm name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('submits the entered values to the signup mutation', async () => {
    const { mutate } = renderSignup()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText('Law firm name'), {
      target: { value: 'Doe & Associates' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        { name: 'Jane Doe', email: 'jane@example.com', law_firm_name: 'Doe & Associates' },
        expect.anything(),
      ),
    )
  })

  it('auto-logs the user in and navigates to the app on success', async () => {
    const { mutate, setUser } = renderSignup()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText('Law firm name'), {
      target: { value: 'Doe & Associates' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const options = mutate.mock.calls[0][1]
    options.onSuccess(authUser)

    expect(setUser).toHaveBeenCalledWith(authUser)
    expect(navigate).toHaveBeenCalledWith('/offenders', { replace: true })
  })
})
