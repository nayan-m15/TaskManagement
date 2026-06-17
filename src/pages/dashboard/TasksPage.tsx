import DashboardSection from '../../components/dashboard/DashboardSection'
import {
  DashboardPageIntro,
  TaskList,
} from '../../components/dashboard/DashboardViews'
import { useDashboardOutlet } from './dashboardContext'

function TasksPage() {
  const { data, session, isError, isLoading } = useDashboardOutlet()

  const assignedTasks = data?.tasks.filter((task) => task.assigneeId === session.user.id) ?? []
  const createdTasks = data?.tasks.filter((task) => task.createdById === session.user.id) ?? []

  return (
    <>
      <DashboardPageIntro
        eyebrow="Tasks"
        title="Assigned and created tasks"
        description="Track what is assigned to you, what you created, and what still needs attention across accessible boards."
      />

      <section className="dashboard-stats-grid dashboard-stats-grid-compact">
        <article className="dashboard-stat-card">
          <div>
            <p className="dashboard-card-label">Assigned to you</p>
            <strong>{assignedTasks.length}</strong>
          </div>
        </article>
        <article className="dashboard-stat-card">
          <div>
            <p className="dashboard-card-label">Created by you</p>
            <strong>{createdTasks.length}</strong>
          </div>
        </article>
        <article className="dashboard-stat-card">
          <div>
            <p className="dashboard-card-label">Visible tasks</p>
            <strong>{data?.tasks.length ?? 0}</strong>
          </div>
        </article>
      </section>

      {isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading tasks</h2>
          <p>We are gathering assigned tasks, created work, and deadline context.</p>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Tasks could not be loaded</h2>
          <p>Try refreshing the dashboard. If the problem continues, inspect task table access and relationships.</p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <section className="dashboard-sections-grid">
          <DashboardSection
            eyebrow="Assigned work"
            title="Tasks assigned to you"
            description="These tasks currently point at your user as the assignee."
          >
            <TaskList
              tasks={assignedTasks}
              emptyMessage="No tasks are assigned to you right now."
            />
          </DashboardSection>

          <DashboardSection
            eyebrow="Owned work"
            title="Tasks created by you"
            description="These tasks were created by your account and remain visible in your accessible boards."
          >
            <TaskList
              tasks={createdTasks}
              emptyMessage="You have not created any visible tasks yet."
            />
          </DashboardSection>
        </section>
      ) : null}
    </>
  )
}

export default TasksPage
