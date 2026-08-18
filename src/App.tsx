import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from './api/client'
import { logWarn } from './api/logger'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AppRoutes } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

function UnauthorizedWatcher() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logWarn('Session unauthorized, redirecting to login')
      setUser(null)
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate, setUser])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UnauthorizedWatcher />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
