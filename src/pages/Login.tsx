import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ErrorBanner } from '../components/ErrorBanner'
import Footer from '../components/Footer'
import { Turnstile, type TurnstileHandle } from '../components/Turnstile'
import { extractErrorMessage, inputClass } from '../utils'

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [turnstileFailed, setTurnstileFailed] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const token = TURNSTILE_SITEKEY ? (await turnstileRef.current?.execute()) ?? '' : ''
      await login(username.trim(), password, token)
      navigate('/offenders', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Login failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">Parole Watch</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Offender status tracking for Texas parolees</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && <ErrorBanner message={error} />}
            <div>
              <label htmlFor="username" className={fieldLabelClass}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                autoComplete="username"
                autoFocus
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className={fieldLabelClass}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
            {TURNSTILE_SITEKEY && (
              <div className="flex justify-center">
                <Turnstile ref={turnstileRef} sitekey={TURNSTILE_SITEKEY} action="login" onError={() => setTurnstileFailed(true)} />
              </div>
            )}
            {turnstileFailed && (
              <p className="text-center text-xs text-red-600">Security verification unavailable. Please try again.</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/signup" className="font-medium text-blue-600 hover:underline">
              Sign up here.
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
