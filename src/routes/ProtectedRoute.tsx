import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from './routeConstants'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isAuthenticated, isLoading, isInitialized } = useAuth()

  if (isLoading || !isInitialized) {
    return (
      <section className="auth-status-screen" aria-live="polite">
        <div className="auth-status-card">
          <h2>Checking your session</h2>
          <p>Please wait while we restore your workspace.</p>
        </div>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
