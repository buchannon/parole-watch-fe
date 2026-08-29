import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import type { AuthUser } from '../types'
import Layout from './Layout'

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../components/ContactSupportModal', () => ({
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

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/offenders']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/offenders" element={<div>Offender page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the Contact support link and username for an authenticated user', () => {
    mockUseAuth.mockReturnValue({ user: authUser, logout: vi.fn() } as any)
    renderLayout()
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Contact support' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })

  it('hides the Contact support link for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() } as any)
    renderLayout()
    expect(screen.queryByRole('button', { name: 'Contact support' })).not.toBeInTheDocument()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })

  it('opens the contact support modal when the link is clicked', () => {
    mockUseAuth.mockReturnValue({ user: authUser, logout: vi.fn() } as any)
    renderLayout()
    expect(screen.queryByText('SUPPORT MODAL')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Contact support' }))
    expect(screen.getByText('SUPPORT MODAL')).toBeInTheDocument()
  })
})
