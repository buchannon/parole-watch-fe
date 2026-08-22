import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOffenders, useUnfollowOffender } from '../api/offenders'
import { isSubscriptionError } from '../auth/subscription'
import { DataTable, type Column, type SortState } from '../components/DataTable'
import { ErrorBanner } from '../components/ErrorBanner'
import { OffenderFormModal } from '../components/OffenderFormModal'
import { Spinner } from '../components/Spinner'
import { StatusBadge } from '../components/StatusBadge'
import type { Offender, OffenderFilters, OffenderStatus } from '../types'
import {
  buttonPrimaryClass,
  buttonSmallSecondaryClass,
  cn,
  extractErrorMessage,
  formatMonthYear,
  inputClass,
} from '../utils'
import Paywall from './Paywall'

// Sort priority for the status column (mirrors the API's ordering): Approved
// first, then In Parole Review, Not in Parole Review, Unknown.
const STATUS_ORDER: Record<OffenderStatus, number> = {
  Approved: 0,
  'In Parole Review': 1,
  'Not in Parole Review': 2,
  Unknown: 3,
}

// Maps a table column key to the offender field it sorts by.
const SORT_FIELDS: Record<string, string> = {
  name: 'display_name',
  tdcj: 'tdcj_number',
  status: 'status',
  nextReview: 'next_parole_review_date',
}

function compareOffenders(a: Offender, b: Offender, sort: SortState): number {
  const field = SORT_FIELDS[sort.key] ?? 'display_name'
  const direction = sort.direction === 'desc' ? -1 : 1

  if (field === 'status') {
    return direction * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  }

  const left =
    field === 'display_name'
      ? a.display_name || ''
      : field === 'next_parole_review_date'
        ? a.next_parole_review_date || ''
        : a.tdcj_number
  const right =
    field === 'display_name'
      ? b.display_name || ''
      : field === 'next_parole_review_date'
        ? b.next_parole_review_date || ''
        : b.tdcj_number

  // Rows without a value (blank name / undated review) sort last regardless of direction.
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1
  return direction * left.localeCompare(right)
}

function SectionToggle({
  open,
  onToggle,
  controlsId,
  label,
  count,
}: {
  open: boolean
  onToggle: () => void
  controlsId: string
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-600"
    >
      <span aria-hidden="true" className="text-[10px]">
        {open ? '▼' : '▶'}
      </span>
      {label}
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{count}</span>
    </button>
  )
}

export default function OffenderList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mainSort, setMainSort] = useState<SortState>({ key: 'name', direction: 'asc' })
  const [approvedSort, setApprovedSort] = useState<SortState>({ key: 'name', direction: 'asc' })
  const [showMain, setShowMain] = useState(true)
  const [showApproved, setShowApproved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [paywall, setPaywall] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const filters = useMemo<OffenderFilters>(
    () => ({
      q: debouncedSearch || undefined,
      active: 'true',
    }),
    [debouncedSearch],
  )

  const { data: offenders, isLoading, isError, error } = useOffenders(filters)
  const unfollowOffender = useUnfollowOffender()

  const handleUnfollow = (offender: Offender) => {
    if (!window.confirm(`Unfollow ${offender.display_name || offender.tdcj_number}? You will stop tracking this offender.`)) return
    setActionError(null)
    unfollowOffender.mutate(offender.id, {
      onError: (err) => {
        if (isSubscriptionError(err)) {
          setPaywall(true)
          return
        }
        setActionError(extractErrorMessage(err, 'Failed to unfollow offender'))
      },
    })
  }

  const activeOffenders = useMemo(
    () =>
      (offenders ?? []).filter(
        (offender) => offender.status === 'In Parole Review' || offender.status === 'Not in Parole Review',
      ),
    [offenders],
  )

  const approvedOffenders = useMemo(
    () => (offenders ?? []).filter((offender) => offender.status === 'Approved'),
    [offenders],
  )

  const sortedActive = useMemo(
    () => [...activeOffenders].sort((a, b) => compareOffenders(a, b, mainSort)),
    [activeOffenders, mainSort],
  )

  const sortedApproved = useMemo(
    () => [...approvedOffenders].sort((a, b) => compareOffenders(a, b, approvedSort)),
    [approvedOffenders, approvedSort],
  )

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
  const totalCount = activeOffenders.length + approvedOffenders.length

  if (paywall || isSubscriptionError(error)) return <Paywall />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Offenders</h1>
        <button type="button" onClick={() => setShowAdd(true)} className={buttonPrimaryClass}>
          Follow new offender
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
      </div>

      {debouncedSearch && (
        <p role="status" className="mb-3 text-sm text-gray-500">
          {totalCount} {totalCount === 1 ? 'result' : 'results'} for "{debouncedSearch}"
        </p>
      )}

      {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setActionError(null)} />}

      <section>
        <SectionToggle
          open={showMain}
          onToggle={() => setShowMain((open) => !open)}
          controlsId="offenders-in-progress"
          label="Offenders in progress"
          count={activeOffenders.length}
        />
        {showMain && (
          <div id="offenders-in-progress" className="mt-3">
            {isLoading ? (
              <Spinner label="Loading offenders…" />
            ) : (
              <DataTable
                columns={columns}
                rows={sortedActive}
                getRowKey={(offender) => offender.id}
                sort={mainSort}
                onSort={setMainSort}
                emptyMessage={
                  debouncedSearch ? 'No offenders match your search.' : 'No offenders yet. Add one to start tracking.'
                }
              />
            )}
          </div>
        )}
      </section>

      {!isLoading && approvedOffenders.length > 0 && (
        <section className="mt-8">
          <SectionToggle
            open={showApproved}
            onToggle={() => setShowApproved((open) => !open)}
            controlsId="approved-offenders"
            label="Offenders approved for parole"
            count={approvedOffenders.length}
          />
          {showApproved && (
            <div id="approved-offenders" className="mt-3">
              <DataTable
                columns={columns}
                rows={sortedApproved}
                getRowKey={(offender) => offender.id}
                sort={approvedSort}
                onSort={setApprovedSort}
                emptyMessage="No approved offenders."
              />
            </div>
          )}
        </section>
      )}

      {showAdd && (
        <OffenderFormModal onClose={() => setShowAdd(false)} onSubscriptionError={() => setPaywall(true)} />
      )}
    </div>
  )
}
