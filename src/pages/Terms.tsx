import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { TERMS_SECTIONS, TERMS_TITLE, TERMS_UPDATED } from '../terms'

export default function Terms() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900">{TERMS_TITLE}</h1>
          <p className="mt-1 text-sm text-gray-500">{TERMS_UPDATED}</p>
          <div className="mt-6 space-y-6">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold text-gray-900">{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="mt-2 text-sm leading-relaxed text-gray-600">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <p className="mt-8 text-xs text-gray-400">
            This page is a plain-English summary for informational purposes only and is not legal advice.
          </p>
          <p className="mt-4">
            <Link to="/signup" className="text-sm font-medium text-blue-600 hover:underline">
              Back to sign up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
