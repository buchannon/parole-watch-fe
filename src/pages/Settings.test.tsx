import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '../api/auth'
import { AuthContext, type AuthContextValue } from '../auth/AuthContext'
import type { AuthUser } from '../types'
import Settings from './Settings'

vi.mock('../api/auth', () => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  meRequest: vi.fn(),
  useUpdateSettings: vi.fn(),
}))

const mockUseUpdateSettings = vi.mocked(authApi.useUpdateSettings)

const initialUser: AuthUser = {
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin',
  groups: ['Test Group'],
  group_settings: [{ name: 'Test Group', operating_state: 'TX', is_subscribed: true }],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
}

function renderSettings(user: AuthUser = initialUser) {
  const mutate = vi.fn()

  function Harness() {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(user)
    const value: AuthContextValue = {
      user: currentUser,
      isAuthenticated: Boolean(currentUser),
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: setCurrentUser,
      refreshUser: vi.fn().mockResolvedValue(user),
    }
    return (
      <AuthContext.Provider value={value}>
        <Settings />
      </AuthContext.Provider>
    )
  }

  mockUseUpdateSettings.mockReturnValue({
    mutate,
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  } as any)

  render(<Harness />)
  return { mutate }
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders account details and the email alert toggles', () => {
    renderSettings()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /receive email alerts/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /weekly offender summary report/i })).toBeInTheDocument()
  })

  it('renders the operating state with its state flag below the group name', () => {
    renderSettings()
    expect(screen.getByText('Test Group')).toBeInTheDocument()
    expect(screen.getByText('Operating State: Texas')).toBeInTheDocument()
    expect(screen.getByAltText('Texas flag')).toHaveAttribute('src', '/flags/tx.svg')
  })

  it('omits the operating state when the group has no setting', () => {
    renderSettings({ ...initialUser, group_settings: [] })
    expect(screen.getByText('Test Group')).toBeInTheDocument()
    expect(screen.queryByText(/operating state/i)).not.toBeInTheDocument()
  })

  it('reflects the enabled setting and fires the mutation when toggled off', () => {
    const { mutate } = renderSettings()
    const toggle = screen.getByRole('switch', { name: /receive email alerts/i })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    expect(mutate).toHaveBeenCalledWith(
      { receive_email_alerts_for_offender_status_changes: false },
      expect.anything(),
    )
    expect(screen.getByRole('switch', { name: /receive email alerts/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('reflects the enabled summary report setting and fires the mutation when toggled off', () => {
    const { mutate } = renderSettings()
    const toggle = screen.getByRole('switch', { name: /weekly offender summary report/i })
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    expect(mutate).toHaveBeenCalledWith(
      { receive_offender_summary_report: false },
      expect.anything(),
    )
    expect(screen.getByRole('switch', { name: /weekly offender summary report/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('reflects disabled settings on load', () => {
    renderSettings({
      ...initialUser,
      settings: {
        receive_email_alerts_for_offender_status_changes: false,
        receive_offender_summary_report: false,
      },
    })
    expect(screen.getByRole('switch', { name: /receive email alerts/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('switch', { name: /weekly offender summary report/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })
})
