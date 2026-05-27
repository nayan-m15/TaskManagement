import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import DashboardPage from '../pages/DashboardPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProtectedRoute from './ProtectedRoute'
import { ROUTES } from './routeConstants'
import { useAuth } from '../hooks/useAuth'

function DefaultRedirect() {
  const { isAuthenticated, isInitialized, isLoading } = useAuth()

  if (isLoading || !isInitialized) {
    return (
      <section className="auth-status-screen" aria-live="polite">
        <div className="auth-status-card">
          <h2>Loading</h2>
          <p>Preparing the right page for you.</p>
        </div>
      </section>
    )
  }

  return (
    <Navigate
      to={isAuthenticated ? ROUTES.dashboard : ROUTES.login}
      replace
    />
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomePage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route
        path={ROUTES.dashboard}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  )
}

export default AppRoutes
