import { Navigate, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthed, RequireAuth } from './auth/RequireAuth'
import Layout from './pages/Layout'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import OffenderDetail from './pages/OffenderDetail'
import OffenderList from './pages/OffenderList'
import Subscribers from './pages/Subscribers'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Navigate to="/offenders" replace />} />
        <Route path="/offenders" element={<OffenderList />} />
        <Route path="/offenders/:id" element={<OffenderDetail />} />
        <Route path="/subscribers" element={<Subscribers />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
