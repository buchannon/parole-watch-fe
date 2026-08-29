import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { logInfo, logWarn } from './logger'

export interface SupportResponse {
  id: string
  detail: string
}

export function useSendSupportRequest() {
  return useMutation({
    mutationFn: (message: string) =>
      api.post<SupportResponse>('/support/', { message }).then((res) => res.data),
    onSuccess: () => {
      logInfo('Support request sent')
    },
    onError: (error) => {
      logWarn('Failed to send support request', error)
    },
  })
}
