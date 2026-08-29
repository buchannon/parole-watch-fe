import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ContactSupportModal } from '../components/ContactSupportModal'
import Footer from '../components/Footer'
import { buttonSecondaryClass, cn } from '../utils'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn('text-sm font-medium', isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900')
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [supportOpen, setSupportOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/offenders" className="text-lg font-bold text-gray-900">
              Parole Watch
            </Link>
            <NavLink to="/offenders" className={navLinkClass} end>
              Offenders
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              Settings
            </NavLink>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="hidden text-sm text-gray-500 sm:inline">{user.username}</span>}
            {user && (
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Contact support
              </button>
            )}
            <button type="button" onClick={handleLogout} className={buttonSecondaryClass}>
              Log out
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      {supportOpen && <ContactSupportModal onClose={() => setSupportOpen(false)} />}
    </div>
  )
}
