import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as signupApi from '../api/signup'
import { useAuth } from '../auth/AuthContext'
import { TERMS_TEXT } from '../terms'
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
  group_settings: [{ name: 'Doe & Associates', operating_state: 'TX', is_subscribed: false }],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
}

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isSuccess: false, error: null }
}

const PASSWORD = 'MediumStr0ng!Pass'

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

function fillBaseFields() {
  fireEvent.change(screen.getByLabelText('Law firm name'), {
    target: { value: 'Doe & Associates' },
  })
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Jane Doe' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
}

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the headline, benefits list, and form fields', () => {
    renderSignup()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByAltText('Texas flag')).toHaveAttribute('src', '/flags/tx.svg')
    expect(screen.getByText('Texas')).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Law firm name')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /I agree to the Terms & Conditions/ })).not.toBeChecked()
    expect(screen.getAllByRole('button', { name: 'Terms & Conditions' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('opens the terms modal from the checkbox without losing the form', async () => {
    renderSignup()
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Terms & Conditions' })[0])

    expect(screen.getByRole('dialog', { name: 'Parole Watch Terms & Conditions' })).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toHaveValue('Jane Doe')

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not submit until the terms are accepted', async () => {
    const { mutate } = renderSignup()
    fillBaseFields()
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => expect(mutate).not.toHaveBeenCalled())
    expect(screen.getByText('You must agree to the Terms & Conditions to sign up.')).toBeInTheDocument()
  })

  it('blocks submit with a weak password', async () => {
    const { mutate } = renderSignup()
    fillBaseFields()
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree to the Terms & Conditions/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => expect(mutate).not.toHaveBeenCalled())
    expect(screen.getByText(/stronger password/)).toBeInTheDocument()
  })

  it('blocks submit when passwords do not match', async () => {
    const { mutate } = renderSignup()
    fillBaseFields()
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Different!Pass1' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree to the Terms & Conditions/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => expect(mutate).not.toHaveBeenCalled())
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('submits the entered values to the signup mutation', async () => {
    const { mutate } = renderSignup()
    fillBaseFields()
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree to the Terms & Conditions/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          law_firm_name: 'Doe & Associates',
          password: PASSWORD,
          agree_to_terms: true,
          terms_text: TERMS_TEXT,
        },
        expect.anything(),
      ),
    )
  })

  it('auto-logs the user in and navigates to the app on success', async () => {
    const { mutate, setUser } = renderSignup()
    fillBaseFields()
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: PASSWORD } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: PASSWORD } })
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree to the Terms & Conditions/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))

    await waitFor(() => expect(mutate).toHaveBeenCalled())
    const options = mutate.mock.calls[0][1]
    options.onSuccess(authUser)

    expect(setUser).toHaveBeenCalledWith(authUser)
    expect(navigate).toHaveBeenCalledWith('/offenders', { replace: true })
  })
})
