import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ContactSupportModal } from './ContactSupportModal'
import { TermsModal } from './TermsModal'

export default function Footer() {
  const { user } = useAuth()
  const [termsOpen, setTermsOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

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
        {user && (
          <>
            {' · '}
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              Get support
            </button>
          </>
        )}
      </div>
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      {supportOpen && <ContactSupportModal onClose={() => setSupportOpen(false)} />}
    </footer>
  )
}
