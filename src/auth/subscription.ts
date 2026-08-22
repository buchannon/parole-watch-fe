import { isAxiosError } from 'axios'
import type { AuthUser } from '../types'

export const SUBSCRIPTION_INACTIVE_DETAIL = 'Your group subscription is not active.'

export function isSubscribed(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.group_settings?.some((group) => group.is_subscribed))
}

export function isSubscriptionError(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 403) return false
  const detail = (error.response.data as { detail?: unknown } | null)?.detail
  return detail === SUBSCRIPTION_INACTIVE_DETAIL
}
