import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useResetPassword } from '../api/passwordReset'
import { ErrorBanner } from '../components/ErrorBanner'
import Footer from '../components/Footer'
import { Turnstile, type TurnstileHandle } from '../components/Turnstile'
import { validatePassword } from '../password'
import { buttonPrimaryClass, cn, extractErrorMessage, inputClass } from '../utils'

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const resetPassword = useResetPassword()
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [turnstileFailed, setTurnstileFailed] = useState(false)

  if (!email || !token) {
    return <Navigate to="/forgot-password" replace />
  }

  const passwordCheck = validatePassword(password)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!passwordCheck.valid) {
      setError('Please choose a stronger password (at least 8 characters and 3 of: lowercase, uppercase, digit, symbol).')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    const turnstileToken = TURNSTILE_SITEKEY ? (await turnstileRef.current?.execute()) ?? '' : ''
    resetPassword.mutate(
      {
        email,
        token,
        password,
        ...(turnstileToken ? { cf_turnstile_response: turnstileToken } : {}),
      },
      {
        onSuccess: (user) => {
          setUser(user)
          navigate('/offenders', { replace: true })
        },
        onError: (err) =>
          setError(extractErrorMessage(err, 'Could not reset your password. Please try again.')),
      },
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">Parole Watch</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Choose a new password</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <ErrorBanner message={error} />}
            <div>
              <label htmlFor="password" className={fieldLabelClass}>
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                autoFocus
                className={inputClass}
              />
              {password && (
                <p
                  className={cn(
                    'mt-1 text-xs',
                    passwordCheck.valid ? 'text-green-700' : 'text-gray-500',
                  )}
                >
                  Strength: {passwordCheck.label}
                  {passwordCheck.valid ? ' — looks good.' : ''}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className={fieldLabelClass}>
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
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
              disabled={resetPassword.isPending}
              className={`${buttonPrimaryClass} w-full`}
            >
              {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
