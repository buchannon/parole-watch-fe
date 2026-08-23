import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'
import { logError, logInfo } from './logger'
import type { BulkImportJob } from '../types'

export const bulkImportKeys = {
  detail: (id: string) => ['bulk-import', id] as const,
}

export function useCreateBulkImport() {
  return useMutation({
    mutationFn: (tdcjNumbers: string[]) =>
      api.post<BulkImportJob>('/offenders/bulk_import/', { tdcj_numbers: tdcjNumbers }).then((res) => res.data),
    onSuccess: () => {
      logInfo('Bulk import started')
    },
    onError: (error) => {
      logError('Failed to start bulk import', error)
    },
  })
}

export function useBulkImportJob(id: string, enabled: boolean) {
  return useQuery({
    queryKey: bulkImportKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<BulkImportJob>(`/offenders/bulk_import/${id}/`)
      return data
    },
    enabled: enabled && id.length > 0,
    // Process-on-poll: each fetch advances the job by one item server-side.
    // Poll while running, stop once completed.
    refetchInterval: (query) => (query.state.data?.status === 'running' ? 3000 : false),
  })
}
