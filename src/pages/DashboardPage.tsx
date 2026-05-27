import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../services/authService'
import { ROUTES } from '../routes/routeConstants'

function DashboardPage() {
  const navigate = useNavigate()
  const { session, clearSession } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const displayName =
    session?.user.username || session?.user.fullName || session?.user.email || 'there'

  async function handleLogout() {
    setLogoutError(null)
    setIsLoggingOut(true)

    try {
      await logout()
      clearSession()
      navigate(ROUTES.login, { replace: true })
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'Unable to sign out right now.',
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <DashboardLayout>
      <section className="dashboard-shell">
        <div className="dashboard-panel">
          <p className="auth-eyebrow">Authenticated workspace</p>
          <h1>Welcome, {displayName}</h1>
          <p className="auth-copy">
            You&apos;re signed in and your session is being managed through Supabase
            Auth.
          </p>
          <div className="dashboard-details">
            <p>
              Signed in as <strong>{session?.user.email ?? 'Unknown email'}</strong>
            </p>
          </div>
          {logoutError ? (
            <p className="auth-message auth-message-error" role="alert">
              {logoutError}
            </p>
          ) : null}
          <button
            type="button"
            className="auth-submit auth-submit-secondary"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </section>
    </DashboardLayout>
  )
}

export default DashboardPage
