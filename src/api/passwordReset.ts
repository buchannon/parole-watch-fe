import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { logInfo, logWarn } from './logger'
import type { AuthUser } from '../types'

export interface RequestPasswordResetPayload {
  email: string
  cf_turnstile_response?: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  cf_turnstile_response?: string
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: RequestPasswordResetPayload) =>
      api.post<{ detail: string }>('/auth/password/reset/', payload).then((res) => res.data),
    onSuccess: (_data, payload) => {
      logInfo('Password reset email requested', payload.email)
    },
    onError: (error) => {
      logWarn('Password reset request failed', error)
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      api
        .post<AuthUser>('/auth/password/reset/confirm/', {
          email: payload.email,
          token: payload.token,
          new_password: payload.password,
          ...(payload.cf_turnstile_response ? { cf_turnstile_response: payload.cf_turnstile_response } : {}),
        })
        .then((res) => res.data),
    onSuccess: (_data, payload) => {
      logInfo('Password reset completed', payload.email)
    },
    onError: (error) => {
      logWarn('Password reset failed', error)
    },
  })
}
