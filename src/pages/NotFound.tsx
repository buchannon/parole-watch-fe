import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-sm text-gray-500">Page not found.</p>
        <Link to="/offenders" className="text-sm font-medium text-blue-600 hover:underline">
          Back to offenders
        </Link>
      </div>
      <Footer />
    </div>
  )
}
