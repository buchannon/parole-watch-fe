import { Modal } from './Modal'
import { TERMS_SECTIONS, TERMS_TITLE, TERMS_UPDATED } from '../terms'

interface TermsModalProps {
  open: boolean
  onClose: () => void
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  if (!open) return null
  return (
    <Modal title={TERMS_TITLE} onClose={onClose}>
      <p className="text-sm text-gray-500">{TERMS_UPDATED}</p>
      <div className="mt-4 max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        {TERMS_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h3 className="text-sm font-semibold text-gray-900">{section.heading}</h3>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index} className="mt-2 text-sm leading-relaxed text-gray-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">
        This page is a plain-English summary for informational purposes only and is not legal advice.
      </p>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Got it
        </button>
      </div>
    </Modal>
  )
}
