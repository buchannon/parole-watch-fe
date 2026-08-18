import { cn, normalizeStatus } from '../utils'
import type { OffenderStatus } from '../types'

const statusStyles: Record<OffenderStatus, string> = {
  'In Parole Review': 'bg-yellow-100 text-yellow-800',
  'Not in Parole Review': 'bg-green-100 text-green-800',
  Unknown: 'bg-gray-100 text-gray-700',
}

export function StatusBadge({ status }: { status: unknown }) {
  const normalized = normalizeStatus(status)
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[normalized])}>
      {normalized}
    </span>
  )
}
