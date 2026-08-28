import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as billingApi from '../api/billing'
import { useAuth } from '../auth/AuthContext'
import { TERMS_TITLE } from '../terms'
import type { AuthUser } from '../types'
import Paywall from './Paywall'

vi.mock('../api/billing', () => ({
  useCreateCheckoutSession: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUseCreateCheckoutSession = vi.mocked(billingApi.useCreateCheckoutSession)
const mockUseAuth = vi.mocked(useAuth)

const unsubscribedUser: AuthUser = {
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin',
  groups: ['Test Group'],
  group_settings: [{ name: 'Test Group', operating_state: 'TX', is_subscribed: false }],
  settings: {
    receive_email_alerts_for_offender_status_changes: true,
    receive_offender_summary_report: true,
  },
}

function mockMutation(): any {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
}

function renderPaywall() {
  const mutate = vi.fn()
  mockUseCreateCheckoutSession.mockReturnValue({ ...mockMutation(), mutate })
  mockUseAuth.mockReturnValue({ user: unsubscribedUser, refreshUser: vi.fn().mockResolvedValue(unsubscribedUser) } as any)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <Paywall />
    </QueryClientProvider>,
  )
  return { mutate }
}

describe('Paywall', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { assign: vi.fn() },
      writable: true,
    })
  })

  it('renders the subscription message and subscribe button', () => {
    renderPaywall()
    expect(screen.getByText('Your subscription is inactive')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument()
  })

  it('opens and closes the Terms & Conditions modal', () => {
    renderPaywall()
    fireEvent.click(screen.getByRole('button', { name: 'Terms & Conditions' }))
    expect(screen.getByRole('heading', { name: TERMS_TITLE })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('heading', { name: TERMS_TITLE })).not.toBeInTheDocument()
  })

  it('redirects to the Stripe checkout URL when subscribing succeeds', async () => {
    const { mutate } = renderPaywall()
    const assign = vi.mocked(window.location.assign)
    const session = { checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_123', session_id: 'cs_test_123' }
    mutate.mockImplementation((_v: undefined, opts?: { onSuccess?: (s: typeof session) => void }) => {
      opts?.onSuccess?.(session)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))

    expect(mutate).toHaveBeenCalled()
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_123'))
  })

  it('shows an error banner when checkout fails', async () => {
    const { mutate } = renderPaywall()
    mutate.mockImplementation((_v: undefined, opts?: { onError?: (err: unknown) => void }) => {
      opts?.onError?.(new Error('billing unconfigured'))
    })

    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
