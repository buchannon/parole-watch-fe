import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useSignup } from '../api/signup'
import { ErrorBanner } from '../components/ErrorBanner'
import Footer from '../components/Footer'
import { TermsModal } from '../components/TermsModal'
import { Turnstile, type TurnstileHandle } from '../components/Turnstile'
import { getState } from '../states'
import { TERMS_TEXT } from '../terms'
import { buttonPrimaryClass, extractErrorMessage, inputClass } from '../utils'

const fieldLabelClass = 'mb-1 block text-sm font-medium text-gray-700'

const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY

const BENEFITS = [
  'Automatically monitor the parole status of any offender you track — no more manual daily checks.',
  'Get an email alert when an offender\u2019s status changes, so nothing slips through.',
  'Keep status-change history for every offender you track.',
]

const SUPPORTED_STATES = ['TX']

export default function Signup() {
  const signup = useSignup()
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [lawFirmName, setLawFirmName] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileFailed, setTurnstileFailed] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!agreeToTerms) {
      setError('You must agree to the Terms & Conditions to sign up.')
      return
    }
    const token = TURNSTILE_SITEKEY ? (await turnstileRef.current?.execute()) ?? '' : ''
    signup.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        law_firm_name: lawFirmName.trim(),
        agree_to_terms: true,
        terms_text: TERMS_TEXT,
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-2xl font-bold text-gray-900">Parole Watch</h1>
          <p className="mt-1 text-center text-sm text-gray-500">Offender status tracking</p>
          <ul className="mt-6 space-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-2 text-sm text-gray-600">
                <span className="text-blue-600">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Supported states</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {SUPPORTED_STATES.map((code) => {
                const state = getState(code)
                return state ? (
                  <li
                    key={code}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
                  >
                    <img
                      src={state.flag}
                      alt={`${state.name} flag`}
                      className="h-4 w-6 rounded-[2px] object-cover shadow-sm"
                    />
                    {state.name}
                  </li>
                ) : null
              })}
            </ul>
          </div>
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
            <div className="flex items-start gap-2">
              <input
                id="agree-to-terms"
                name="agree_to_terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(event) => setAgreeToTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="agree-to-terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Terms & Conditions
                </button>
                .
              </label>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-center">
              <p className="text-sm font-semibold text-gray-900">Just $30 / month</p>
              <p className="mt-0.5 text-xs text-gray-600">
                Cancel within your first month for a full money-back refund.
              </p>
            </div>
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
      <Footer />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  )
}
