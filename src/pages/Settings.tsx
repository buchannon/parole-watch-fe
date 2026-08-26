import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { isSubscribed } from '../auth/subscription'
import { useUpdateSettings } from '../api/auth'
import { useCreateBillingPortalSession } from '../api/billing'
import { DocumentTemplates } from '../components/DocumentTemplates'
import { ErrorBanner } from '../components/ErrorBanner'
import { Spinner } from '../components/Spinner'
import { getState } from '../states'
import { buttonPrimaryClass, cn, extractErrorMessage } from '../utils'
import type { UserSettings } from '../types'

export default function Settings() {
  const { user, isLoading, setUser } = useAuth()
  const updateSettings = useUpdateSettings()
  const billingPortal = useCreateBillingPortalSession()
  const [billingError, setBillingError] = useState<string | null>(null)

  if (isLoading) return <Spinner label="Loading settings…" />
  if (!user) return null

  const emailAlertsEnabled = user.settings?.receive_email_alerts_for_offender_status_changes ?? true
  const summaryReportEnabled = user.settings?.receive_offender_summary_report ?? true
  const operatingState = getState(user.group_settings?.[0]?.operating_state)

  const handleToggle = (key: keyof UserSettings, checked: boolean) => {
    const previous = user
    setUser({
      ...user,
      settings: { ...user.settings, [key]: checked },
    })
    updateSettings.mutate({ [key]: checked } as Partial<UserSettings>, {
      onError: () => previous && setUser(previous),
    })
  }

  const handleManageSubscription = () => {
    setBillingError(null)
    billingPortal.mutate(undefined, {
      onSuccess: (session) => {
        window.location.assign(session.url)
      },
      onError: (err) =>
        setBillingError(extractErrorMessage(err, 'Unable to open billing management. Please try again.')),
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Group</h2>
        <p className="mt-2 text-sm text-gray-900">{user.groups.join(', ') || '—'}</p>
        {operatingState && (
          <div className="mt-2 flex items-center gap-2">
            <img
              src={operatingState.flag}
              alt={`${operatingState.name} flag`}
              className="h-4 w-6 rounded-[2px] object-cover shadow-sm"
            />
            <span className="text-sm font-medium text-gray-900">
              Operating State: {operatingState.name}
            </span>
          </div>
        )}
      </section>

      {isSubscribed(user) && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700">Subscription</h2>
          <p className="mt-2 text-sm text-gray-500">
            Manage your plan, payment method, invoices, or cancel your subscription.
          </p>
          {billingError && (
            <div className="mt-3">
              <ErrorBanner message={billingError} onDismiss={() => setBillingError(null)} />
            </div>
          )}
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={billingPortal.isPending}
            className={`${buttonPrimaryClass} mt-3`}
          >
            {billingPortal.isPending ? 'Opening billing…' : 'Manage subscription & billing'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Billing is handled securely by Stripe. You will be returned here when you are done.
          </p>
        </section>
      )}

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

      <DocumentTemplates />

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Email alerts</h2>
        <div className="mt-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Receive email when an offender&apos;s status changes
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={emailAlertsEnabled}
              aria-label="Receive email alerts for offender status changes"
              disabled={updateSettings.isPending}
              onClick={() => handleToggle('receive_email_alerts_for_offender_status_changes', !emailAlertsEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                emailAlertsEnabled ? 'bg-blue-600' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  emailAlertsEnabled ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">Receive the weekly offender summary report</p>
            <button
              type="button"
              role="switch"
              aria-checked={summaryReportEnabled}
              aria-label="Receive the weekly offender summary report"
              disabled={updateSettings.isPending}
              onClick={() => handleToggle('receive_offender_summary_report', !summaryReportEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                summaryReportEnabled ? 'bg-blue-600' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  summaryReportEnabled ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
