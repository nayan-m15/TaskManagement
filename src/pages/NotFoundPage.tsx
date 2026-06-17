import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ThemeToggle from '../components/ThemeToggle'
import { ROUTES } from '../routes/routeConstants'

function NotFoundPage() {
  return (
    <MainLayout>
      <section className="not-found-page">
        <div className="not-found-toolbar">
          <ThemeToggle />
        </div>
        <div className="not-found-card">
          <p className="auth-eyebrow">404 error</p>
          <h1>Page not found</h1>
          <p className="auth-copy">
            The page you requested is unavailable or may have moved. Return to the
            main workspace entry points below.
          </p>
          <div className="home-actions" aria-label="Recovery actions">
            <Link className="home-button home-button-primary" to={ROUTES.home}>
              Go home
            </Link>
            <Link className="home-button home-button-secondary" to={ROUTES.login}>
              Log in
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}

export default NotFoundPage
