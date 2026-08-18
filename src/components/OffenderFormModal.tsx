import { useState, type FormEvent } from 'react'
import { useCreateOffender, useUpdateOffender } from '../api/offenders'
import { buttonSecondaryClass, buttonPrimaryClass, dateOrNull, extractErrorMessage, inputClass } from '../utils'
import type { Offender } from '../types'
import { ErrorBanner } from './ErrorBanner'
import { Modal } from './Modal'

interface OffenderFormModalProps {
  offender?: Offender | null
  onClose: () => void
}

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

export function OffenderFormModal({ offender, onClose }: OffenderFormModalProps) {
  const isEdit = Boolean(offender)
  const createOffender = useCreateOffender()
  const updateOffender = useUpdateOffender()
  const [error, setError] = useState<string | null>(null)
  const pending = createOffender.isPending || updateOffender.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)

    if (isEdit && offender) {
      updateOffender.mutate(
        {
          id: offender.id,
          patch: {
            display_name: String(form.get('display_name') ?? ''),
            current_facility: String(form.get('current_facility') ?? ''),
            projected_release_date: dateOrNull(form.get('projected_release_date')),
            parole_eligibility_date: dateOrNull(form.get('parole_eligibility_date')),
            max_sentence_date: dateOrNull(form.get('max_sentence_date')),
            is_active: form.get('is_active') === 'on',
          },
        },
        {
          onSuccess: onClose,
          onError: (err) => setError(extractErrorMessage(err, 'Failed to save offender')),
        },
      )
      return
    }

    const tdcjNumber = String(form.get('tdcj_number') ?? '').trim()
    createOffender.mutate(tdcjNumber, {
      onSuccess: onClose,
      onError: (err) => setError(extractErrorMessage(err, 'Failed to add offender')),
    })
  }

  return (
    <Modal title={isEdit ? 'Edit offender' : 'Add offender'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        {isEdit && offender ? (
          <>
            <div>
              <label htmlFor="display_name" className={fieldLabelClass}>
                Display name
              </label>
              <input id="display_name" name="display_name" type="text" defaultValue={offender.display_name} className={inputClass} />
            </div>
            <div>
              <label htmlFor="current_facility" className={fieldLabelClass}>
                Current facility
              </label>
              <input id="current_facility" name="current_facility" type="text" defaultValue={offender.current_facility} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="projected_release_date" className={fieldLabelClass}>
                  Projected release
                </label>
                <input
                  id="projected_release_date"
                  name="projected_release_date"
                  type="date"
                  defaultValue={offender.projected_release_date ?? undefined}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="parole_eligibility_date" className={fieldLabelClass}>
                  Parole eligibility
                </label>
                <input
                  id="parole_eligibility_date"
                  name="parole_eligibility_date"
                  type="date"
                  defaultValue={offender.parole_eligibility_date ?? undefined}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="max_sentence_date" className={fieldLabelClass}>
                  Max sentence
                </label>
                <input id="max_sentence_date" name="max_sentence_date" type="date" defaultValue={offender.max_sentence_date ?? undefined} className={inputClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input id="is_active" name="is_active" type="checkbox" defaultChecked={offender.is_active} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              Active offender
            </label>
          </>
        ) : (
          <div>
            <label htmlFor="tdcj_number" className={fieldLabelClass}>
              TDCJ number
            </label>
            <input id="tdcj_number" name="tdcj_number" type="text" required autoFocus placeholder="e.g. 00637060" className={inputClass} />
            <p className="mt-1 text-xs text-gray-500">The SID number and profile are looked up automatically via the TDCJ search.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonSecondaryClass}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className={buttonPrimaryClass}>
            {pending ? 'Saving…' : isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
