import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as signupApi from '../api/signup'
import Signup from './Signup'

vi.mock('../api/signup', () => ({
  useSignup: vi.fn(),
}))

const mockUseSignup = vi.mocked(signupApi.useSignup)

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isSuccess: false, error: null }
}

function renderSignup() {
  const mutate = vi.fn()
  mockUseSignup.mockReturnValue({ ...mockMutation(), mutate })
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>,
  )
  return { mutate }
}

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the headline, benefits list, and form fields', () => {
    renderSignup()
    expect(screen.getByText('Want to sign up? Contact me for pricing.')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tell me briefly about your business/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request pricing' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('submits the entered values to the signup mutation', () => {
    const { mutate } = renderSignup()
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText(/Tell me briefly about your business/i), {
      target: { value: 'I run a law office.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Request pricing' }))

    expect(mutate).toHaveBeenCalledWith(
      { name: 'Jane Doe', email: 'jane@example.com', description: 'I run a law office.' },
      expect.anything(),
    )
  })

  it('shows a thank-you message when the mutation succeeds', () => {
    mockUseSignup.mockReturnValue({ ...mockMutation(), isSuccess: true })
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Thanks/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toBeInTheDocument()
  })
})
