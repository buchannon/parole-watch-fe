import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
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
        description: description.trim(),
        ...(token ? { cf_turnstile_response: token } : {}),
      },
      {
        onError: (err) => setError(extractErrorMessage(err, 'Failed to send your request. Please try again.')),
      },
    )
  }

  if (signup.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Thanks, {name.split(' ')[0] || 'there'}!</h1>
          <p className="mt-2 text-sm text-gray-500">Your request has been sent. I&apos;ll get back to you about pricing.</p>
          <Link to="/login" className={`${buttonPrimaryClass} mt-6`}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-900">Parole Watch</h1>
        <p className="mt-1 text-center text-sm text-gray-500">Offender status tracking for Texas parolees</p>
        <h2 className="mt-6 text-center text-lg font-semibold text-gray-900">Want to sign up? Contact me for pricing.</h2>
        <ul className="mt-4 space-y-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2 text-sm text-gray-600">
              <span className="text-blue-600">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <label htmlFor="description" className={fieldLabelClass}>
              Briefly describe your needs
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
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
            {signup.isPending ? 'Sending…' : 'Request pricing'}
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
