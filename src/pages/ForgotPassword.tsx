import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useRequestPasswordReset } from '../api/passwordReset'
import { ErrorBanner } from '../components/ErrorBanner'
import Footer from '../components/Footer'
import { Turnstile, type TurnstileHandle } from '../components/Turnstile'
import { buttonPrimaryClass, extractErrorMessage, inputClass } from '../utils'

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY

export default function ForgotPassword() {
  const resetRequest = useRequestPasswordReset()
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [turnstileFailed, setTurnstileFailed] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSent(false)
    const token = TURNSTILE_SITEKEY ? (await turnstileRef.current?.execute()) ?? '' : ''
    resetRequest.mutate(
      { email: email.trim(), ...(token ? { cf_turnstile_response: token } : {}) },
      {
        onSuccess: () => setSent(true),
        onError: (err) =>
          setError(extractErrorMessage(err, 'Could not send the reset link. Please try again.')),
      },
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">Parole Watch</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Reset your password</p>
          {sent ? (
            <div className="mt-6 rounded-lg border border-green-100 bg-green-50 p-3 text-center text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Reset link sent</p>
              <p className="mt-0.5 text-xs text-gray-600">
                If an account exists for {email.trim()}, a password reset link is on its way.
                Check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && <ErrorBanner message={error} />}
              <div>
                <label htmlFor="email" className={fieldLabelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className={inputClass}
                />
              </div>
              {TURNSTILE_SITEKEY && (
                <div className="flex justify-center">
                  <Turnstile
                    ref={turnstileRef}
                    sitekey={TURNSTILE_SITEKEY}
                    action="password_reset"
                    onError={() => setTurnstileFailed(true)}
                  />
                </div>
              )}
              {turnstileFailed && (
                <p className="text-center text-xs text-red-600">
                  Security verification unavailable. Please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={resetRequest.isPending}
                className={`${buttonPrimaryClass} w-full`}
              >
                {resetRequest.isPending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-gray-500">
            Remembered it?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
