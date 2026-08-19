import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOffenders, useUnfollowOffender } from '../api/offenders'
import { DataTable, type Column, type SortState } from '../components/DataTable'
import { ErrorBanner } from '../components/ErrorBanner'
import { OffenderFormModal } from '../components/OffenderFormModal'
import { Spinner } from '../components/Spinner'
import { StatusBadge } from '../components/StatusBadge'
import type { Offender, OffenderFilters } from '../types'
import {
  buttonPrimaryClass,
  buttonSmallSecondaryClass,
  cn,
  extractErrorMessage,
  formatMonthYear,
  inputClass,
} from '../utils'

const STATUS_CHIPS: Array<{ value: '' | 'APPROVED' | 'IN_REVIEW' | 'NOT_IN_REVIEW' | 'UNKNOWN'; label: string }> = [
  { value: '', label: 'All' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'NOT_IN_REVIEW', label: 'Not in Review' },
  { value: 'UNKNOWN', label: 'Unknown' },
]

// Maps a table column key to the API `?ordering=` field. Only columns listed
// here are sortable.
const SORT_FIELDS: Record<string, string> = {
  name: 'display_name',
  tdcj: 'tdcj_number',
  status: 'status',
  nextReview: 'next_parole_review_date',
}

export default function OffenderList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<'' | 'APPROVED' | 'IN_REVIEW' | 'NOT_IN_REVIEW' | 'UNKNOWN'>('')
  const [sort, setSort] = useState<SortState>({ key: 'status', direction: 'asc' })
  const [showAdd, setShowAdd] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const ordering = useMemo(() => {
    const field = SORT_FIELDS[sort.key]
    if (!field) return undefined
    return sort.direction === 'desc' ? `-${field}` : field
  }, [sort])

  const filters = useMemo<OffenderFilters>(
    () => ({
      q: debouncedSearch || undefined,
      status: status || undefined,
      active: 'true',
      ordering,
    }),
    [debouncedSearch, status, ordering],
  )

  const { data: offenders, isLoading, isError, error } = useOffenders(filters)
  const unfollowOffender = useUnfollowOffender()

  const handleUnfollow = (offender: Offender) => {
    if (!window.confirm(`Unfollow ${offender.display_name || offender.tdcj_number}? You will stop tracking this offender.`)) return
    setActionError(null)
    unfollowOffender.mutate(offender.id, {
      onError: (err) => setActionError(extractErrorMessage(err, 'Failed to unfollow offender')),
    })
  }

  const columns: Column<Offender>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (offender) => (
        <Link to={`/offenders/${offender.id}`} className="font-medium text-blue-600 hover:underline">
          {offender.display_name || '—'}
        </Link>
      ),
    },
    { key: 'tdcj', header: 'TDCJ #', sortable: true, render: (offender) => <span className="font-mono">{offender.tdcj_number}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (offender) => <StatusBadge status={offender.status} /> },
    {
      key: 'nextReview',
      header: 'Next review',
      sortable: true,
      render: (offender) => formatMonthYear(offender.next_parole_review_date),
    },
    {
      key: 'actions',
      header: '',
      render: (offender) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => handleUnfollow(offender)} className={buttonSmallSecondaryClass}>
            Unfollow
          </button>
        </div>
      ),
    },
  ]

  const errorMessage = isError ? extractErrorMessage(error, 'Failed to load offenders') : actionError

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Offenders</h1>
        <button type="button" onClick={() => setShowAdd(true)} className={buttonPrimaryClass}>
          Add offender
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, TDCJ # or SID…"
          aria-label="Search offenders"
          className={cn(inputClass, 'max-w-xs')}
        />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.value || 'all'}
              type="button"
              onClick={() => setStatus(chip.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium',
                status === chip.value ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setActionError(null)} />}

      {isLoading ? (
        <Spinner label="Loading offenders…" />
      ) : (
        <DataTable
          columns={columns}
          rows={offenders ?? []}
          getRowKey={(offender) => offender.id}
          sort={sort}
          onSort={setSort}
          emptyMessage={
            search || status ? 'No offenders match your filters.' : 'No offenders yet. Add one to start tracking.'
          }
        />
      )}

      {showAdd && <OffenderFormModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
