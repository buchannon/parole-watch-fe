import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateCheckoutSession } from '../api/billing'
import { offenderKeys } from '../api/offenders'
import { useAuth } from '../auth/AuthContext'
import { isSubscribed } from '../auth/subscription'
import { ErrorBanner } from '../components/ErrorBanner'
import { TermsModal } from '../components/TermsModal'
import { buttonPrimaryClass, extractErrorMessage } from '../utils'

export default function Paywall() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const checkout = useCreateCheckoutSession()
  const [error, setError] = useState<string | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    refreshUser()
      .then((authUser) => {
        if (!cancelled && isSubscribed(authUser)) {
          queryClient.invalidateQueries({ queryKey: offenderKeys.all })
        }
      })
      .catch(() => {
        // Refresh failure still leaves the paywall visible; the Subscribe button remains usable.
      })
    return () => {
      cancelled = true
    }
  }, [refreshUser, queryClient])

  const groupName = user?.groups?.[0] || 'your group'

  const handleSubscribe = () => {
    setError(null)
    checkout.mutate(undefined, {
      onSuccess: (session) => {
        window.location.assign(session.checkout_url)
      },
      onError: (err) => setError(extractErrorMessage(err, 'Unable to start checkout. Please try again.')),
    })
  }

  if (isSubscribed(user)) return null

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Your subscription is inactive</h1>
        <p className="mt-3 text-sm text-gray-600">
          {groupName} has not yet subscribed to Parole Watch. Subscribe to unlock offender tracking,
          status alerts, and review history.
        </p>
        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Terms & Conditions
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={checkout.isPending}
          className={`${buttonPrimaryClass} mt-4 w-full`}
        >
          {checkout.isPending ? 'Redirecting to checkout…' : 'Subscribe'}
        </button>
        <p className="mt-4 text-xs text-gray-500">
          Payment is processed securely by Stripe. You will be returned here once checkout is complete.
        </p>
      </div>
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  )
}
