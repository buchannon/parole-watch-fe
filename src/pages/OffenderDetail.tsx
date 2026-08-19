import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useOffender, useOffenderStatuses } from '../api/offenders'
import { ErrorBanner } from '../components/ErrorBanner'
import { Spinner } from '../components/Spinner'
import { StatusBadge } from '../components/StatusBadge'
import { cn, extractErrorMessage, formatDate, formatDateTime, formatMonthYear, normalizeStatus } from '../utils'

export default function OffenderDetail() {
  const { id = '' } = useParams()
  const { data: offender, isLoading, isError, error } = useOffender(id)
  const statuses = useOffenderStatuses(id)

  if (isLoading) return <Spinner label="Loading offender…" />
  if (isError || !offender) return <ErrorBanner message={extractErrorMessage(error, 'Failed to load offender')} />

  const decision = offender.last_parole_decision.toLowerCase()
  const decisionStyle =
    decision === 'approved'
      ? 'border-green-200 bg-green-50'
      : decision === 'denied'
        ? 'border-red-200 bg-red-50'
        : 'border-gray-200 bg-gray-50'

  return (
    <div className="space-y-8">
      <div>
        <Link to="/offenders" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to offenders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{offender.display_name || offender.tdcj_number}</h1>
          <StatusBadge status={offender.status} />
        </div>
      </div>

      <div className="flex items-baseline gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Next parole review</span>
        <span className="text-lg font-semibold text-blue-700">{formatMonthYear(offender.next_parole_review_date)}</span>
      </div>

      <div className={cn('rounded-lg border px-4 py-3', decisionStyle)}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Last parole decision</span>
          <DecisionBadge decision={decision} />
          <span className="text-sm font-medium text-gray-700">{formatDate(offender.last_parole_decision_date)}</span>
        </div>
        {offender.denial_reasons && (
          <p className="mt-2 text-sm text-gray-700">
            Denial reasons: <span className="font-semibold">{offender.denial_reasons}</span>
          </p>
        )}
        {offender.last_parole_decision_note && (
          <p className="mt-1 text-sm italic text-gray-600">"{offender.last_parole_decision_note}"</p>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label="TDCJ number" value={offender.tdcj_number} />
        <DetailField label="SID number" value={offender.sid_number || '—'} />
        <DetailField label="Race" value={offender.race || '—'} />
        <DetailField label="Gender" value={offender.gender || '—'} />
        <DetailField label="Age" value={offender.age != null ? String(offender.age) : '—'} />
        <DetailField label="Current facility" value={offender.current_facility || '—'} />
        <DetailField label="Parole eligibility date" value={formatDate(offender.parole_eligibility_date)} />
        <DetailField label="Projected release date" value={formatDate(offender.projected_release_date)} />
        <DetailField label="Max sentence date" value={formatDate(offender.max_sentence_date)} />
        <DetailField label="Visitation eligible" value={offender.visitation_eligible || '—'} />
        <DetailField label="Last scraped" value={formatDate(offender.date_last_scraped)} />
        <DetailField
          label="Profile"
          value={
            offender.profile_url ? (
              <a href={offender.profile_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                View profile
              </a>
            ) : (
              '—'
            )
          }
        />
      </dl>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Status history</h2>
        {statuses.isLoading ? (
          <Spinner label="Loading status history…" />
        ) : statuses.isError ? (
          <ErrorBanner message={extractErrorMessage(statuses.error, 'Failed to load status history')} />
        ) : statuses.data && statuses.data.length > 0 ? (
          <ol className="relative mt-4 space-y-5 border-l-2 border-gray-200 pl-6">
            {statuses.data.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[1.875rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={normalizeStatus(item.status)} />
                  <span className="text-xs text-gray-500">{formatDateTime(item.created)}</span>
                </div>
                {item.edited && item.edited !== item.created && (
                  <p className="mt-1 text-xs text-gray-400">Last edited: {formatDateTime(item.edited)}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No status history recorded yet.</p>
        )}
      </section>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

function DecisionBadge({ decision }: { decision: string }) {
  if (decision !== 'approved' && decision !== 'denied') {
    return <span className="text-lg font-semibold text-gray-700">—</span>
  }
  const styles = decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles)}>
      {decision === 'approved' ? 'Approved' : 'Denied'}
    </span>
  )
}
