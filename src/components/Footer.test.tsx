import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import type { AuthUser } from '../types'
import Footer from './Footer'

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./ContactSupportModal', () => ({
  ContactSupportModal: () => <div>SUPPORT MODAL</div>,
}))

const mockUseAuth = vi.mocked(useAuth)

const authUser: AuthUser = {
  username: 'alice',
  email: 'alice@example.com',
  name: 'Alice',
  groups: ['The Law Office of Mani Nezami'],
  group_settings: [{ name: 'The Law Office of Mani Nezami', operating_state: 'TX', is_subscribed: true }],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
}

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: null } as any)
  })

  it('renders the current-year copyright with a link to the hiring site', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: 'J Showers Digital Consulting LLC' })
    expect(link).toHaveAttribute('href', 'https://hire.jshowers.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument()
  })

  it('opens the Terms & Conditions modal from the footer', () => {
    render(<Footer />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Terms & Conditions' }))
    expect(screen.getByRole('dialog', { name: 'Parole Watch Terms & Conditions' })).toBeInTheDocument()
    expect(screen.getByText(/30-day money-back guarantee/)).toBeInTheDocument()
  })

  it('closes the Terms & Conditions modal', () => {
    render(<Footer />)
    fireEvent.click(screen.getByRole('button', { name: 'Terms & Conditions' }))
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the Get support link for an authenticated user', () => {
    mockUseAuth.mockReturnValue({ user: authUser } as any)
    render(<Footer />)
    expect(screen.getByRole('button', { name: 'Get support' })).toBeInTheDocument()
  })

  it('hides the Get support link for unauthenticated users', () => {
    render(<Footer />)
    expect(screen.queryByRole('button', { name: 'Get support' })).not.toBeInTheDocument()
  })

  it('opens the contact support modal when Get support is clicked', () => {
    mockUseAuth.mockReturnValue({ user: authUser } as any)
    render(<Footer />)
    expect(screen.queryByText('SUPPORT MODAL')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Get support' }))
    expect(screen.getByText('SUPPORT MODAL')).toBeInTheDocument()
  })
})
