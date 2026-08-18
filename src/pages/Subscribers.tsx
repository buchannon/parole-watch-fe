import { useState } from 'react'
import { useDeleteSubscriber, useSubscribers, useUpdateSubscriber } from '../api/subscribers'
import { DataTable, type Column } from '../components/DataTable'
import { ErrorBanner } from '../components/ErrorBanner'
import { Spinner } from '../components/Spinner'
import { SubscriberForm } from '../components/SubscriberForm'
import type { Subscriber } from '../types'
import { buttonSmallDangerClass, buttonSmallSecondaryClass, extractErrorMessage } from '../utils'

export default function Subscribers() {
  const { data: subscribers, isLoading, isError, error } = useSubscribers()
  const updateSubscriber = useUpdateSubscriber()
  const deleteSubscriber = useDeleteSubscriber()
  const [actionError, setActionError] = useState<string | null>(null)

  const handleToggle = (subscriber: Subscriber) => {
    setActionError(null)
    updateSubscriber.mutate(
      { id: subscriber.id, patch: { is_active: !subscriber.is_active } },
      { onError: (err) => setActionError(extractErrorMessage(err, 'Failed to update subscriber')) },
    )
  }

  const handleDelete = (subscriber: Subscriber) => {
    if (!window.confirm(`Delete subscriber ${subscriber.email}?`)) return
    setActionError(null)
    deleteSubscriber.mutate(subscriber.id, {
      onError: (err) => setActionError(extractErrorMessage(err, 'Failed to delete subscriber')),
    })
  }

  const columns: Column<Subscriber>[] = [
    { key: 'name', header: 'Name', render: (subscriber) => subscriber.name || '—' },
    { key: 'email', header: 'Email', render: (subscriber) => subscriber.email },
    {
      key: 'active',
      header: 'Active',
      render: (subscriber) => (
        <button
          type="button"
          onClick={() => handleToggle(subscriber)}
          aria-pressed={subscriber.is_active}
          className={subscriber.is_active ? buttonSmallSecondaryClass : buttonSmallDangerClass}
        >
          {subscriber.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (subscriber) => (
        <button type="button" onClick={() => handleDelete(subscriber)} className={buttonSmallDangerClass}>
          Delete
        </button>
      ),
    },
  ]

  const errorMessage = isError ? extractErrorMessage(error, 'Failed to load subscribers') : actionError

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Subscribers</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Add subscriber</h2>
        <SubscriberForm />
      </section>

      {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setActionError(null)} />}

      {isLoading ? (
        <Spinner label="Loading subscribers…" />
      ) : (
        <DataTable
          columns={columns}
          rows={subscribers ?? []}
          getRowKey={(subscriber) => subscriber.id}
          emptyMessage="No subscribers yet. Add one to get notified when a status changes."
        />
      )}
    </div>
  )
}
