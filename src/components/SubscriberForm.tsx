import { useState, type FormEvent } from 'react'
import { useCreateSubscriber } from '../api/subscribers'
import { buttonPrimaryClass, extractErrorMessage, inputClass } from '../utils'
import { ErrorBanner } from './ErrorBanner'

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

export function SubscriberForm() {
  const createSubscriber = useCreateSubscriber()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    createSubscriber.mutate(
      { email: email.trim(), name: name.trim() || undefined, is_active: true },
      {
        onSuccess: () => {
          setName('')
          setEmail('')
        },
        onError: (err) => setError(extractErrorMessage(err, 'Failed to add subscriber')),
      },
    )
  }

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="subscriber-name" className={fieldLabelClass}>
            Name (optional)
          </label>
          <input
            id="subscriber-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
            placeholder="Jane Doe"
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="subscriber-email" className={fieldLabelClass}>
            Email
          </label>
          <input
            id="subscriber-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="jane@example.com"
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={createSubscriber.isPending} className={buttonPrimaryClass}>
          {createSubscriber.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>
    </div>
  )
}
