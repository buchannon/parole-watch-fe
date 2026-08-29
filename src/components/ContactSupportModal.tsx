import { useState, type FormEvent } from 'react'
import { useSendSupportRequest } from '../api/support'
import { buttonPrimaryClass, buttonSecondaryClass, extractErrorMessage, inputClass } from '../utils'
import { ErrorBanner } from './ErrorBanner'
import { Modal } from './Modal'

interface ContactSupportModalProps {
  onClose: () => void
}

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

export function ContactSupportModal({ onClose }: ContactSupportModalProps) {
  const sendSupportRequest = useSendSupportRequest()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const pending = sendSupportRequest.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const message = String(form.get('message') ?? '').trim()
    if (!message) return
    sendSupportRequest.mutate(message, {
      onSuccess: () => setSent(true),
      onError: (err) => {
        setError(extractErrorMessage(err, 'Failed to send your message'))
      },
    })
  }

  return (
    <Modal title={sent ? 'Message sent' : 'Contact support'} onClose={onClose}>
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Your message has been sent. We&apos;ll get back to you at the email address on your
            account.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={buttonPrimaryClass}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}

          <div>
            <label htmlFor="support_message" className={fieldLabelClass}>
              How can we help?
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Describe the issue you&apos;re running into and we&apos;ll reply to your account email.
            </p>
            <textarea
              id="support_message"
              name="message"
              rows={7}
              required
              autoFocus
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={buttonSecondaryClass}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonPrimaryClass}>
              {pending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
