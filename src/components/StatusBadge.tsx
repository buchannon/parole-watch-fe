import { cn, normalizeStatus } from '../utils'
import type { OffenderStatus } from '../types'

const statusStyles: Record<OffenderStatus, string> = {
  Approved: 'bg-green-100 text-green-800',
  'In Parole Review': 'bg-blue-100 text-blue-800',
  'Not in Parole Review': 'bg-gray-100 text-gray-800',
  Unknown: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: unknown }) {
  const normalized = normalizeStatus(status)
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[normalized])}>
      {normalized}
    </span>
  )
}
