import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { logError, logInfo } from './logger'
import type { Offender, OffenderFilters, OffenderStatusHistoryItem } from '../types'

export const offenderKeys = {
  all: ['offenders'] as const,
  list: (filters: OffenderFilters) => ['offenders', filters] as const,
  detail: (id: string) => ['offender', id] as const,
  statuses: (id: string) => ['offender-statuses', id] as const,
}

function cleanParams(filters: OffenderFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.q) params.q = filters.q
  if (filters.status) params.status = filters.status
  if (filters.active) params.active = filters.active
  if (filters.ordering) params.ordering = filters.ordering
  return params
}

function makeTempOffender(tdcjNumber: string): Offender {
  return {
    id: `temp-${Date.now()}`,
    display_name: '',
    race: '',
    gender: '',
    age: null,
    profile_url: '',
    is_active: true,
    date_last_scraped: null,
    sid_number: '',
    tdcj_number: tdcjNumber,
    max_sentence_date: null,
    current_facility: '',
    projected_release_date: null,
    parole_eligibility_date: null,
    parole_details_url: '',
    visitation_eligible: '',
    status: 'Unknown',
  }
}

export function useOffenders(filters: OffenderFilters) {
  return useQuery({
    queryKey: offenderKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<Offender[]>('/offenders/', { params: cleanParams(filters) })
      return data
    },
    placeholderData: (previous) => previous,
  })
}

export function useOffender(id: string) {
  return useQuery({
    queryKey: offenderKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Offender>(`/offenders/${id}/`)
      return data
    },
    enabled: id.length > 0,
  })
}

export function useOffenderStatuses(id: string) {
  return useQuery({
    queryKey: offenderKeys.statuses(id),
    queryFn: async () => {
      const { data } = await api.get<OffenderStatusHistoryItem[]>(`/offenders/${id}/statuses/`)
      return data
    },
    enabled: id.length > 0,
  })
}

export function useCreateOffender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tdcjNumber: string) => api.post<Offender>('/offenders/', { tdcj_number: tdcjNumber }).then((res) => res.data),
    onMutate: async (tdcjNumber) => {
      await queryClient.cancelQueries({ queryKey: offenderKeys.all })
      const previous = queryClient.getQueriesData<Offender[]>({ queryKey: offenderKeys.all })
      const temp = makeTempOffender(tdcjNumber)
      queryClient.setQueriesData<Offender[]>({ queryKey: offenderKeys.all }, (old) => (old ? [temp, ...old] : [temp]))
      return { previous }
    },
    onError: (error, _tdcjNumber, context) => {
      logError('Failed to create offender', error)
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, () => data))
    },
    onSuccess: () => {
      logInfo('Offender created')
      queryClient.invalidateQueries({ queryKey: offenderKeys.all })
    },
  })
}

export function useUnfollowOffender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/offenders/${id}/unfollow/`).then(() => id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: offenderKeys.all })
      const previous = queryClient.getQueriesData<Offender[]>({ queryKey: offenderKeys.all })
      queryClient.setQueriesData<Offender[]>({ queryKey: offenderKeys.all }, (old) => old?.filter((offender) => offender.id !== id))
      return { previous }
    },
    onError: (error, _id, context) => {
      logError('Failed to unfollow offender', error)
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, () => data))
    },
    onSuccess: (_data, id) => {
      logInfo('Offender unfollowed')
      queryClient.invalidateQueries({ queryKey: offenderKeys.all })
      queryClient.removeQueries({ queryKey: offenderKeys.detail(id) })
      queryClient.removeQueries({ queryKey: offenderKeys.statuses(id) })
    },
  })
}
