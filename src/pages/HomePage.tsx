import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes/routeConstants'
import '../App.css'

const features = [
  {
    title: 'Kanban boards',
    description:
      'Organize work visually with clear stages, focused priorities, and room for every task.',
  },
  {
    title: 'Team collaboration',
    description:
      'Keep teammates aligned with shared ownership, clear assignments, and one source of truth.',
  },
  {
    title: 'Deadlines and priorities',
    description:
      'Surface urgent work early so deadlines, blockers, and high-impact items stay visible.',
  },
  {
    title: 'Comments and activity tracking',
    description:
      'Capture decisions, follow updates, and maintain context without leaving the workflow.',
  },
  {
    title: 'Workspaces',
    description:
      'Group boards by team or project so planning stays structured as work grows over time.',
  },
] as const

const workflowSteps = [
  'Create a workspace',
  'Add a board',
  'Create columns',
  'Add and assign tasks',
  'Track progress',
] as const

function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <MainLayout>
      <header className="home-header">
        <nav className="home-nav" aria-label="Primary">
          <Link className="home-brand" to={ROUTES.home}>
            TaskFlow
          </Link>
          <ul className="home-nav-list">
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#workflow">Workflow</a>
            </li>
            <li>
              <Link to={ROUTES.register}>Get started</Link>
            </li>
            <li>
              <Link to={ROUTES.login}>Log in</Link>
            </li>
            {isAuthenticated ? (
              <li>
                <Link to={ROUTES.dashboard}>Dashboard</Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <p className="home-eyebrow">Task management for focused teams</p>
        <h1 id="home-title">Plan work clearly, move tasks with confidence, and keep progress visible.</h1>
        <p className="home-lead">
          TaskFlow helps teams manage workspaces, boards, deadlines, and daily
          execution in one calm, reliable place.
        </p>
        <nav className="home-actions" aria-label="Primary actions">
          <Link className="home-button home-button-primary" to={ROUTES.register}>
            Get started
          </Link>
          <Link className="home-button home-button-secondary" to={ROUTES.login}>
            Log in
          </Link>
          {isAuthenticated ? (
            <Link className="home-button home-button-tertiary" to={ROUTES.dashboard}>
              Open dashboard
            </Link>
          ) : null}
        </nav>
      </section>

      <section id="features" className="home-section" aria-labelledby="features-title">
        <header className="home-section-header">
          <p className="home-section-label">Features</p>
          <h2 id="features-title">Built for structured planning and steady execution.</h2>
          <p className="home-section-copy">
            Every part of the platform is designed to reduce ambiguity and keep work
            moving without unnecessary complexity.
          </p>
        </header>
        <ul className="home-feature-list">
          {features.map((feature) => (
            <li key={feature.title} className="home-feature-item">
              <article>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section id="workflow" className="home-section" aria-labelledby="workflow-title">
        <header className="home-section-header">
          <p className="home-section-label">Workflow</p>
          <h2 id="workflow-title">A simple flow from setup to delivery.</h2>
          <p className="home-section-copy">
            Start with a workspace, shape your process with boards and columns, then
            assign and track work as it moves forward.
          </p>
        </header>
        <ol className="home-workflow-list">
          {workflowSteps.map((step) => (
            <li key={step} className="home-workflow-item">
              <h3>{step}</h3>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section home-cta" aria-labelledby="cta-title">
        <header className="home-section-header">
          <p className="home-section-label">Next step</p>
          <h2 id="cta-title">Set up your account and start organizing work today.</h2>
          <p className="home-section-copy">
            Create an account to begin building your workspace, or return to your
            dashboard if you&apos;re already signed in.
          </p>
        </header>
        <nav className="home-actions" aria-label="Final actions">
          <Link className="home-button home-button-primary" to={ROUTES.register}>
            Create account
          </Link>
          {isAuthenticated ? (
            <Link className="home-button home-button-secondary" to={ROUTES.dashboard}>
              Open dashboard
            </Link>
          ) : (
            <Link className="home-button home-button-secondary" to={ROUTES.login}>
              Log in
            </Link>
          )}
        </nav>
      </section>

      <footer className="home-footer">
        <p>TaskFlow keeps planning, priorities, and progress in one dependable workspace.</p>
      </footer>
    </MainLayout>
  )
}

export default HomePage
