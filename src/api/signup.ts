import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { logInfo, logWarn } from './logger'
import type { AuthUser } from '../types'

export interface SignupPayload {
  name: string
  email: string
  law_firm_name: string
  cf_turnstile_response?: string
}

export function useSignup() {
  return useMutation({
    mutationFn: (payload: SignupPayload) =>
      api.post<AuthUser>('/signup/', payload).then((res) => res.data),
    onSuccess: (_data, payload) => {
      logInfo('Account created', payload.email)
    },
    onError: (error) => {
      logWarn('Failed to create account', error)
    },
  })
}
