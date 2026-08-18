import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { logError, logInfo } from './logger'
import type { Subscriber } from '../types'

export const subscriberKeys = {
  all: ['subscribers'] as const,
}

export interface CreateSubscriberPayload {
  email: string
  name?: string
  is_active?: boolean
}

export interface UpdateSubscriberPayload {
  id: string
  patch: Partial<Pick<Subscriber, 'name' | 'email' | 'is_active'>>
}

export function useSubscribers() {
  return useQuery({
    queryKey: subscriberKeys.all,
    queryFn: async () => {
      const { data } = await api.get<Subscriber[]>('/subscribers/')
      return data
    },
  })
}

export function useCreateSubscriber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSubscriberPayload) => api.post<Subscriber>('/subscribers/', payload).then((res) => res.data),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: subscriberKeys.all })
      const previous = queryClient.getQueryData<Subscriber[]>(subscriberKeys.all)
      const temp: Subscriber = {
        id: `temp-${Date.now()}`,
        name: payload.name ?? '',
        email: payload.email,
        is_active: payload.is_active ?? true,
        created: new Date().toISOString(),
      }
      queryClient.setQueryData<Subscriber[]>(subscriberKeys.all, (old) => (old ? [temp, ...old] : [temp]))
      return { previous }
    },
    onError: (error, _payload, context) => {
      logError('Failed to create subscriber', error)
      if (context?.previous !== undefined) queryClient.setQueryData(subscriberKeys.all, () => context.previous)
    },
    onSuccess: () => {
      logInfo('Subscriber created')
      queryClient.invalidateQueries({ queryKey: subscriberKeys.all })
    },
  })
}

export function useUpdateSubscriber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: UpdateSubscriberPayload) => api.patch<Subscriber>(`/subscribers/${id}/`, patch).then((res) => res.data),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: subscriberKeys.all })
      const previous = queryClient.getQueryData<Subscriber[]>(subscriberKeys.all)
      queryClient.setQueryData<Subscriber[]>(subscriberKeys.all, (old) =>
        old?.map((subscriber) => (subscriber.id === id ? { ...subscriber, ...patch } : subscriber)),
      )
      return { previous }
    },
    onError: (error, _variables, context) => {
      logError('Failed to update subscriber', error)
      if (context?.previous !== undefined) queryClient.setQueryData(subscriberKeys.all, () => context.previous)
    },
    onSuccess: () => {
      logInfo('Subscriber updated')
      queryClient.invalidateQueries({ queryKey: subscriberKeys.all })
    },
  })
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/subscribers/${id}/`).then(() => id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: subscriberKeys.all })
      const previous = queryClient.getQueryData<Subscriber[]>(subscriberKeys.all)
      queryClient.setQueryData<Subscriber[]>(subscriberKeys.all, (old) => old?.filter((subscriber) => subscriber.id !== id))
      return { previous }
    },
    onError: (error, _id, context) => {
      logError('Failed to delete subscriber', error)
      if (context?.previous !== undefined) queryClient.setQueryData(subscriberKeys.all, () => context.previous)
    },
    onSuccess: () => {
      logInfo('Subscriber deleted')
      queryClient.invalidateQueries({ queryKey: subscriberKeys.all })
    },
  })
}
