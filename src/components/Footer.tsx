import { useState } from 'react'
import { TermsModal } from './TermsModal'

export default function Footer() {
  const [termsOpen, setTermsOpen] = useState(false)

  return (
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
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </footer>
  )
}
