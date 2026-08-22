import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { logInfo, logWarn } from './logger'
import type { AuthUser, UserSettings } from '../types'

export async function loginRequest(
  username: string,
  password: string,
  cfTurnstileResponse?: string,
): Promise<AuthUser> {
  const payload: Record<string, string> = { username, password }
  if (cfTurnstileResponse) payload.cf_turnstile_response = cfTurnstileResponse
  const { data } = await api.post<AuthUser>('/auth/login/', payload)
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout/')
}

export async function meRequest(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me/')
  return data
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (settings: Partial<UserSettings>) =>
      api.patch<UserSettings>('/auth/settings/', settings).then((res) => res.data),
    onSuccess: () => {
      logInfo('Settings updated')
    },
    onError: (error) => {
      logWarn('Failed to update settings', error)
    },
  })
}
