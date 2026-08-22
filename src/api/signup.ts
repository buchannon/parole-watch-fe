import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { logInfo, logWarn } from './logger'

export interface SignupPayload {
  name: string
  email: string
  description: string
  cf_turnstile_response?: string
}

export function useSignup() {
  return useMutation({
    mutationFn: (payload: SignupPayload) => api.post('/signup/', payload).then((res) => res.data),
    onSuccess: (_data, payload) => {
      logInfo('Signup request sent', payload.email)
    },
    onError: (error) => {
      logWarn('Failed to send signup request', error)
    },
  })
}
