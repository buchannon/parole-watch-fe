import { Navigate, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthed, RequireAuth, RequireSubscription } from './auth/RequireAuth'
import Layout from './pages/Layout'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import OffenderDetail from './pages/OffenderDetail'
import OffenderList from './pages/OffenderList'
import Settings from './pages/Settings'
import Signup from './pages/Signup'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Navigate to="/offenders" replace />} />
        <Route element={<RequireSubscription />}>
          <Route path="/offenders" element={<OffenderList />} />
          <Route path="/offenders/:id" element={<OffenderDetail />} />
        </Route>
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
