import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-sm text-gray-500">Page not found.</p>
      <Link to="/offenders" className="text-sm font-medium text-blue-600 hover:underline">
        Back to offenders
      </Link>
    </div>
  )
}
