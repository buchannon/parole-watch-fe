import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useBulkImportJob, useCreateBulkImport } from '../api/bulkImport'
import { offenderKeys } from '../api/offenders'
import { isSubscriptionError } from '../auth/subscription'
import { parseTdcjList } from '../bulkImport'
import type { BulkImportItem, BulkImportItemStatus } from '../types'
import { buttonPrimaryClass, buttonSecondaryClass, cn, extractErrorMessage, inputClass } from '../utils'
import { ErrorBanner } from './ErrorBanner'
import { Modal } from './Modal'
import { Spinner } from './Spinner'

interface BulkImportModalProps {
  onClose: () => void
  onSubscriptionError?: () => void
}

const ITEM_LABEL: Record<BulkImportItemStatus, string> = {
  pending: 'Queued',
  processing: 'Importing…',
  already_followed: 'Already followed',
  added: 'Added',
  not_found: 'Not found',
  failed: 'Failed',
}

const ITEM_CHIP_CLASS: Record<BulkImportItemStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-800',
  already_followed: 'bg-gray-100 text-gray-800',
  added: 'bg-green-100 text-green-800',
  not_found: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-700',
}

type Stage = 'input' | 'confirm' | 'progress' | 'report'

export function BulkImportModal({ onClose, onSubscriptionError }: BulkImportModalProps) {
  const queryClient = useQueryClient()
  const [stage, setStage] = useState<Stage>('input')
  const [text, setText] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { valid, dropped } = useMemo(() => parseTdcjList(text), [text])
  const createBulkImport = useCreateBulkImport()
  const jobQuery = useBulkImportJob(jobId ?? '', stage === 'progress')
  const job = jobQuery.data

  useEffect(() => {
    if (jobQuery.error && isSubscriptionError(jobQuery.error)) {
      onSubscriptionError?.()
    }
  }, [jobQuery.error, onSubscriptionError])

  useEffect(() => {
    if (job?.status === 'completed' && stage === 'progress') {
      setStage('report')
      queryClient.invalidateQueries({ queryKey: offenderKeys.all })
    }
  }, [job?.status, stage, queryClient])

  const handleStart = () => {
    setError(null)
    createBulkImport.mutate(valid, {
      onSuccess: (created) => {
        setJobId(created.id)
        setStage('progress')
      },
      onError: (err) => {
        if (isSubscriptionError(err)) {
          onSubscriptionError?.()
          return
        }
        setError(extractErrorMessage(err, 'Failed to start bulk import'))
      },
    })
  }

  const processedCount = useMemo(
    () => (job?.items ?? []).filter((item) => item.status !== 'pending').length,
    [job],
  )

  // Progress list order: already-processed/in-flight items always on top,
  // queued items at the bottom — each group in its original (submission) order.
  const orderedItems = useMemo(() => {
    const items = job?.items ?? []
    return [...items].sort((a, b) => (a.status === 'pending' ? 1 : 0) - (b.status === 'pending' ? 1 : 0))
  }, [job])

  const renderItems = (items: BulkImportItem[], showDetail: boolean) => (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.tdcj_number} className="flex items-center justify-between gap-3 text-sm">
          <span className="font-mono">{item.tdcj_number}</span>
          <span className="flex items-center gap-2">
            {showDetail && item.detail && <span className="text-xs text-gray-500">{item.detail}</span>}
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ITEM_CHIP_CLASS[item.status])}>
              {ITEM_LABEL[item.status]}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )

  const reportGroups = useMemo(() => {
    const groups: Record<string, BulkImportItem[]> = {
      added: [],
      already_followed: [],
      not_found: [],
      failed: [],
    }
    for (const item of job?.items ?? []) {
      if (item.status in groups) groups[item.status].push(item)
    }
    return groups
  }, [job])

  return (
    <Modal title="Bulk import offenders" onClose={onClose}>
      {stage === 'input' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="bulk_tdcj_numbers" className="mb-1 block text-sm font-medium text-gray-700">
              TDCJ numbers
            </label>
            <textarea
              id="bulk_tdcj_numbers"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste TDCJ numbers, separated by new lines, commas or spaces…"
              className={cn(inputClass, 'h-40 resize-y font-mono')}
            />
            <p className="mt-1 text-xs text-gray-500">
              {valid.length} valid {valid.length === 1 ? 'number' : 'numbers'} · {dropped.length}{' '}
              {dropped.length === 1 ? 'entry' : 'entries'} ignored (not 8 digits or duplicate)
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={buttonSecondaryClass}>
              Cancel
            </button>
            <button type="button" onClick={() => setStage('confirm')} disabled={valid.length === 0} className={buttonPrimaryClass}>
              Continue
            </button>
          </div>
        </div>
      )}

      {stage === 'confirm' && (
        <div className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <p className="text-sm text-gray-700">
            The following {valid.length} TDCJ {valid.length === 1 ? 'number' : 'numbers'} will be imported:
          </p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-gray-200 p-3">
            <ul className="space-y-1.5">
              {valid.map((number) => (
                <li key={number} className="font-mono text-sm text-gray-800">
                  {number}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500">
            This can take a while...
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setStage('input')} className={buttonSecondaryClass}>
              Back
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={createBulkImport.isPending}
              className={buttonPrimaryClass}
            >
              {createBulkImport.isPending ? 'Starting…' : `Import ${valid.length}`}
            </button>
          </div>
        </div>
      )}

      {stage === 'progress' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Importing {processedCount} of {job?.items.length ?? 0}… Keep this window open while the import runs.
          </p>
          {jobQuery.isLoading && !job && <Spinner label="Starting import…" />}
          {job && (
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-gray-200 p-3">
              {renderItems(orderedItems, false)}
            </div>
          )}
        </div>
      )}

      {stage === 'report' && job && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Import finished.</p>
          {job.summary.added > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-green-800">Added ({job.summary.added})</h3>
              {renderItems(reportGroups.added, false)}
            </div>
          )}
          {job.summary.already_followed > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-gray-700">
                Already followed ({job.summary.already_followed})
              </h3>
              {renderItems(reportGroups.already_followed, false)}
            </div>
          )}
          {job.summary.not_found > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-amber-800">Not found ({job.summary.not_found})</h3>
              {renderItems(reportGroups.not_found, false)}
            </div>
          )}
          {job.summary.failed > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-red-800">Failed ({job.summary.failed})</h3>
              {renderItems(reportGroups.failed, true)}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className={buttonPrimaryClass}>
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
