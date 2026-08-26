import { isAxiosError } from 'axios'
import type { OffenderStatus } from './types'

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

export const buttonPrimaryClass =
  'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

export const buttonSecondaryClass =
  'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

export const buttonDangerClass =
  'inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'

export const buttonSmallSecondaryClass =
  'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50'

export const buttonSmallDangerClass =
  'inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50'

export function normalizeStatus(status: unknown): OffenderStatus {
  switch (status) {
    case 'APPROVED':
      return 'Approved'
    case 'IN_REVIEW':
      return 'In Parole Review'
    case 'NOT_IN_REVIEW':
      return 'Not in Parole Review'
    case 'UNKNOWN':
      return 'Unknown'
    case 'Approved':
    case 'In Parole Review':
    case 'Not in Parole Review':
    case 'Unknown':
      return status
    default:
      return 'Unknown'
  }
}

export function formatDate(value: string | null | undefined): string {
  return value || '—'
}

export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})/.exec(value)
  return match ? `${match[2]}/${match[1]}` : value
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function dateOrNull(value: FormDataEntryValue | null): string | null {
  if (!value) return null
  const text = String(value).trim()
  return text ? text : null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const messages = Object.entries(data as Record<string, unknown>)
        .map(([field, value]) => {
          const parts = Array.isArray(value) ? value.map(String).join(', ') : String(value)
          return parts ? `${field}: ${parts}` : ''
        })
        .filter(Boolean)
      if (messages.length > 0) return messages.join('\n')
    }
    if (error.response?.status === 401) return 'Invalid username or password'
    if (error.response?.status) return `Request failed (${error.response.status})`
  }
  return fallback
}
