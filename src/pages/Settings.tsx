import { useAuth } from '../auth/AuthContext'
import { Spinner } from '../components/Spinner'

export default function Settings() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <Spinner label="Loading settings…" />
  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Group</h2>
        <p className="mt-2 text-sm text-gray-900">{user.groups.join(', ') || '—'}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Your account</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{user.email || '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
