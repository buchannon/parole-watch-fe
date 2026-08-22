import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useSignup } from '../api/signup'
import { ErrorBanner } from '../components/ErrorBanner'
import { Turnstile, type TurnstileHandle } from '../components/Turnstile'
import { buttonPrimaryClass, extractErrorMessage, inputClass } from '../utils'

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY

const BENEFITS = [
  'Automatically monitor the parole status of any Texas offender — no more manual daily checks.',
  'Get an email the moment an offender\u2019s status changes, so nothing slips through.',
  'Keep a full status-change history for every offender you track.',
]

export default function Signup() {
  const signup = useSignup()
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [lawFirmName, setLawFirmName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [turnstileFailed, setTurnstileFailed] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const token = TURNSTILE_SITEKEY ? (await turnstileRef.current?.execute()) ?? '' : ''
    signup.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        law_firm_name: lawFirmName.trim(),
        ...(token ? { cf_turnstile_response: token } : {}),
      },
      {
        onSuccess: (user) => {
          setUser(user)
          navigate('/offenders', { replace: true })
        },
        onError: (err) => setError(extractErrorMessage(err, 'Failed to create your account. Please try again.')),
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-900">Parole Watch</h1>
        <p className="mt-1 text-center text-sm text-gray-500">Offender status tracking for Texas parolees</p>
        <ul className="mt-6 space-y-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2 text-sm text-gray-600">
              <span className="text-blue-600">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        <hr className="my-6 border-gray-200" />
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <div>
            <label htmlFor="name" className={fieldLabelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              autoFocus
              className={inputClass}
            />
          </div>
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
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="lawFirmName" className={fieldLabelClass}>
              Law firm name
            </label>
            <input
              id="lawFirmName"
              name="law_firm_name"
              type="text"
              value={lawFirmName}
              onChange={(event) => setLawFirmName(event.target.value)}
              required
              autoComplete="organization"
              className={inputClass}
            />
          </div>
          {TURNSTILE_SITEKEY && (
            <div className="flex justify-center">
              <Turnstile ref={turnstileRef} sitekey={TURNSTILE_SITEKEY} action="signup" onError={() => setTurnstileFailed(true)} />
            </div>
          )}
          {turnstileFailed && (
            <p className="text-center text-xs text-red-600">Security verification unavailable. Please try again.</p>
          )}
          <button type="submit" disabled={signup.isPending} className={`${buttonPrimaryClass} w-full`}>
            {signup.isPending ? 'Signing up…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
