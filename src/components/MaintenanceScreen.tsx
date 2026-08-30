import { useState } from 'react'
import { TermsModal } from './TermsModal'

export default function MaintenanceScreen() {
  const [termsOpen, setTermsOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Parole Watch</h1>
        <p className="max-w-md text-base text-gray-600">
          Parole Watch is currently unable to receive new data from the state. We hope to have an
          update soon.
        </p>
      </div>
      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()}{' '}
          <a
            href="https://hire.jshowers.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600"
          >
            J Showers Digital Consulting LLC
          </a>
          {' · '}
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            Terms & Conditions
          </button>
        </div>
      </footer>
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  )
}
