import { Link, Navigate, useParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ListTodo } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardSection from '../components/dashboard/DashboardSection'
import { useBoardDetail } from '../hooks/useDashboardData'
import { ROUTES } from '../routes/routeConstants'
import { formatDate } from '../utils/formatDate'

function BoardPage() {
  const { boardId } = useParams()
  const { data, isLoading, isError } = useBoardDetail(boardId)

  if (!boardId) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <DashboardLayout>
      <main className="dashboard-shell dashboard-shell-board">
        <div className="dashboard-main">
          <header className="dashboard-header dashboard-header-board">
            <div>
              <Link className="dashboard-inline-link" to={ROUTES.dashboard}>
                <ChevronLeft size={16} aria-hidden="true" />
                Back to dashboard
              </Link>
              <p className="auth-eyebrow">Board overview</p>
              <h1>{data?.board?.name ?? 'Board details'}</h1>
              <p className="auth-copy">
                {data?.board?.workspaceName
                  ? `View recent tasks and deadlines for ${data.board.workspaceName}.`
                  : 'View recent tasks and deadlines for this board.'}
              </p>
            </div>
          </header>

          {isLoading ? (
            <section className="dashboard-feedback-card" aria-live="polite">
              <p className="dashboard-card-label">Loading</p>
              <h2>Loading board details</h2>
              <p>We are gathering the latest tasks and board metadata.</p>
            </section>
          ) : null}

          {!isLoading && isError ? (
            <section className="dashboard-feedback-card" role="alert">
              <p className="dashboard-card-label">Unavailable</p>
              <h2>Board details could not be loaded</h2>
              <p>This board may no longer exist, or your session may not have access to it.</p>
            </section>
          ) : null}

          {!isLoading && !isError && !data?.board ? (
            <section className="dashboard-feedback-card">
              <p className="dashboard-card-label">Not found</p>
              <h2>Board not found</h2>
              <p>No board matched this link in the current workspace context.</p>
            </section>
          ) : null}

          {!isLoading && !isError && data?.board ? (
            <>
              <section className="dashboard-stats-grid" aria-label="Board summary">
                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-icon">
                    <ListTodo size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="dashboard-card-label">Tasks</p>
                    <strong>{data.tasks.length}</strong>
                  </div>
                </article>

                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-icon">
                    <CalendarDays size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="dashboard-card-label">Last updated</p>
                    <strong>
                      {data.board.updatedAt
                        ? formatDate(data.board.updatedAt)
                        : data.board.createdAt
                          ? formatDate(data.board.createdAt)
                          : 'Unavailable'}
                    </strong>
                  </div>
                </article>
              </section>

              <DashboardSection
                eyebrow="Board tasks"
                title="Task list"
                description="Tasks are ordered with the nearest due items first so the most urgent work stays visible."
              >
                {data.tasks.length > 0 ? (
                  <ul className="dashboard-task-list" aria-label="Board tasks">
                    {data.tasks.map((task) => (
                      <li id={`task-${task.id}`} key={task.id} className="dashboard-task-item">
                        <div className="dashboard-task-main">
                          <div className="dashboard-item-heading">
                            <h3>{task.title}</h3>
                            <div className="dashboard-badge-row">
                              {task.priority ? (
                                <span className="dashboard-badge dashboard-badge-neutral">
                                  {task.priority}
                                </span>
                              ) : null}
                              {task.status ? (
                                <span className="dashboard-badge dashboard-badge-accent">
                                  {task.status}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="dashboard-meta-row">
                            {task.columnName ? <span>{task.columnName}</span> : null}
                            {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="dashboard-empty-state">
                    <h3>No tasks yet</h3>
                    <p>This board does not have any visible tasks in the current workspace context.</p>
                  </div>
                )}
              </DashboardSection>
            </>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  )
}

export default BoardPage
