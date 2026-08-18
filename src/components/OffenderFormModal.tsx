import { useState, type FormEvent } from 'react'
import { useCreateOffender } from '../api/offenders'
import { buttonSecondaryClass, buttonPrimaryClass, extractErrorMessage, inputClass } from '../utils'
import { ErrorBanner } from './ErrorBanner'
import { Modal } from './Modal'

interface OffenderFormModalProps {
  onClose: () => void
}

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

export function OffenderFormModal({ onClose }: OffenderFormModalProps) {
  const createOffender = useCreateOffender()
  const [error, setError] = useState<string | null>(null)
  const pending = createOffender.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const tdcjNumber = String(form.get('tdcj_number') ?? '').trim()
    createOffender.mutate(tdcjNumber, {
      onSuccess: onClose,
      onError: (err) => setError(extractErrorMessage(err, 'Failed to add offender')),
    })
  }

  return (
    <Modal title="Add offender" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <div>
          <label htmlFor="tdcj_number" className={fieldLabelClass}>
            TDCJ number
          </label>
          <input id="tdcj_number" name="tdcj_number" type="text" required autoFocus placeholder="e.g. 00637060" className={inputClass} />
          <p className="mt-1 text-xs text-gray-500">The SID number and profile are looked up automatically via the TDCJ search.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonSecondaryClass}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className={buttonPrimaryClass}>
            {pending ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
