import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { logInfo, logWarn } from './logger'

export interface CheckoutSession {
  checkout_url: string
  session_id: string
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: () => api.post<CheckoutSession>('/billing/checkout/').then((res) => res.data),
    onSuccess: () => {
      logInfo('Checkout session created')
    },
    onError: (error) => {
      logWarn('Failed to create checkout session', error)
    },
  })
}

export function useCreateBillingPortalSession() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>('/billing/portal/').then((res) => res.data),
    onSuccess: () => {
      logInfo('Billing portal session created')
    },
    onError: (error) => {
      logWarn('Failed to create billing portal session', error)
    },
  })
}
