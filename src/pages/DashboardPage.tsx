import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../services/authService'
import { ROUTES } from '../routes/routeConstants'

const workspaceNotes = [
  'Protected routes are active and session state is restored on refresh.',
  'Authentication is managed through Supabase with client-side session syncing.',
  'This dashboard is ready for your next workspace, board, and task management surfaces.',
] as const

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
      navigate(ROUTES.home, { replace: true })
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
        <aside className="dashboard-sidebar" aria-label="Workspace navigation">
          <div className="dashboard-sidebar-brand">
            <p className="dashboard-sidebar-label">TaskFlow</p>
            <h2>Workspace</h2>
          </div>
          <nav className="dashboard-nav">
            <a className="dashboard-nav-item dashboard-nav-item-active" href="#overview">
              Overview
            </a>
            <a className="dashboard-nav-item" href="#account">
              Account
            </a>
            <a className="dashboard-nav-item" href="#security">
              Security
            </a>
          </nav>
          <div className="dashboard-sidebar-card">
            <p className="dashboard-sidebar-label">Signed in as</p>
            <strong>{session?.user.email ?? 'Unknown email'}</strong>
          </div>
        </aside>

        <div className="dashboard-main">
          <header id="overview" className="dashboard-header">
            <div>
              <p className="auth-eyebrow">Authenticated workspace</p>
              <h1>Welcome, {displayName}</h1>
              <p className="auth-copy">
                Your session is active, your route protection is in place, and the
                workspace shell is ready for task management views.
              </p>
            </div>
            <button
              type="button"
              className="auth-submit auth-submit-secondary"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Logout'}
            </button>
          </header>

          <section className="dashboard-grid" aria-label="Workspace overview">
            <article className="dashboard-card dashboard-card-featured">
              <p className="dashboard-card-label">Status</p>
              <h2>Session healthy</h2>
              <p>
                Authentication is connected and your protected dashboard loaded
                successfully.
              </p>
            </article>

            <article id="account" className="dashboard-card">
              <p className="dashboard-card-label">Account</p>
              <h2>{displayName}</h2>
              <p>{session?.user.email ?? 'Unknown email'}</p>
            </article>

            <article id="security" className="dashboard-card">
              <p className="dashboard-card-label">Security</p>
              <h2>Managed with Supabase Auth</h2>
              <p>Session restoration and sign-out are both enabled in the current flow.</p>
            </article>
          </section>

          <section className="dashboard-detail-panels" aria-label="Workspace details">
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <p className="dashboard-card-label">Implementation notes</p>
                  <h2>Current dashboard foundation</h2>
                </div>
                <span className="home-status-pill">Ready</span>
              </div>
              <ul className="dashboard-notes-list">
                {workspaceNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>

            <article className="dashboard-panel">
              <p className="dashboard-card-label">User details</p>
              <h2>Session details</h2>
              <div className="dashboard-details">
                <p>
                  Signed in as <strong>{session?.user.email ?? 'Unknown email'}</strong>
                </p>
                <p>
                  User ID <strong>{session?.user.id ?? 'Unavailable'}</strong>
                </p>
                <p>
                  Username <strong>{session?.user.username ?? 'Not provided'}</strong>
                </p>
              </div>
            </article>
          </section>

          {logoutError ? (
            <p className="auth-message auth-message-error" role="alert">
              {logoutError}
            </p>
          ) : null}
        </div>
      </section>
    </DashboardLayout>
  )
}

export default DashboardPage
