import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { logInfo, logWarn } from './logger'
import type { TemplatePlaceholder, TemplateType, TemplateTypeEntry, UploadedTemplate } from '../types'

export const templateKeys = {
  catalog: ['templates', 'catalog'] as const,
  placeholders: ['templates', 'placeholders'] as const,
}

export interface UploadTemplateInput {
  templateType: TemplateType
  file: File
  groupId?: number
}

export function useTemplateCatalog(enabled = true) {
  return useQuery({
    queryKey: templateKeys.catalog,
    queryFn: async () => {
      const { data } = await api.get<TemplateTypeEntry[]>('/templates/')
      return data
    },
    enabled,
  })
}

export function useTemplatePlaceholders(enabled = true) {
  return useQuery({
    queryKey: templateKeys.placeholders,
    queryFn: async () => {
      const { data } = await api.get<TemplatePlaceholder[]>('/templates/placeholders/')
      return data
    },
    enabled,
  })
}

export function useUploadTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ templateType, file, groupId }: UploadTemplateInput) => {
      const form = new FormData()
      form.append('template_type', templateType)
      form.append('file', file)
      if (groupId) form.append('group_id', String(groupId))
      return api.post<UploadedTemplate>('/templates/', form).then((res) => res.data)
    },
    onSuccess: () => {
      logInfo('Document template uploaded')
      queryClient.invalidateQueries({ queryKey: templateKeys.catalog })
    },
    onError: (error) => {
      logWarn('Failed to upload document template', error)
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}/`).then(() => id),
    onSuccess: () => {
      logInfo('Document template removed')
      queryClient.invalidateQueries({ queryKey: templateKeys.catalog })
    },
    onError: (error) => {
      logWarn('Failed to remove document template', error)
    },
  })
}

export function templateDownloadUrl(id: string): string {
  return api.getUri({ url: `/templates/${id}/` })
}

export function templateGenerateUrl(templateType: TemplateType, offenderId: string): string {
  return api.getUri({ url: `/templates/${templateType}/generate/`, params: { offender: offenderId } })
}

export function triggerDownload(url: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
