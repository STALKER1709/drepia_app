import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Layout from './Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DailyEntry from './pages/DailyEntry'
import WeeklyEntry from './pages/WeeklyEntry'
import MonthlyEntry from './pages/MonthlyEntry'
import Reports from './pages/Reports'
import UsersAdmin from './pages/UsersAdmin'

function RequireAuth({ children, roles }: { children: JSX.Element; roles?: string[] }): JSX.Element {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="saisie/journalier"
          element={
            <RequireAuth roles={['admin', 'agent', 'superviseur']}>
              <DailyEntry />
            </RequireAuth>
          }
        />
        <Route
          path="saisie/hebdomadaire"
          element={
            <RequireAuth roles={['admin', 'agent', 'superviseur']}>
              <WeeklyEntry />
            </RequireAuth>
          }
        />
        <Route
          path="saisie/mensuel"
          element={
            <RequireAuth roles={['admin', 'agent', 'superviseur']}>
              <MonthlyEntry />
            </RequireAuth>
          }
        />
        <Route
          path="rapports"
          element={
            <RequireAuth roles={['admin', 'superviseur', 'lecture']}>
              <Reports />
            </RequireAuth>
          }
        />
        <Route
          path="utilisateurs"
          element={
            <RequireAuth roles={['admin']}>
              <UsersAdmin />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  )
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
