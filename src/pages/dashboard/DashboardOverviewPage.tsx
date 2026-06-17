import { Link, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  CalendarDays,
  FolderKanban,
  ListTodo,
  Rows3,
} from 'lucide-react'
import DashboardSection from '../../components/dashboard/DashboardSection'
import {
  ActivityFeedList,
  BoardList,
  DashboardPageIntro,
  NotificationList,
  TaskList,
  WorkspaceList,
} from '../../components/dashboard/DashboardViews'
import { ROUTES } from '../../routes/routeConstants'
import { useDashboardOutlet } from './dashboardContext'

function DashboardOverviewPage() {
  const [searchParams] = useSearchParams()
  const { data, displayName, isError, isFetching, isLoading, refetch } = useDashboardOutlet()

  const selectedWorkspaceId = searchParams.get('workspace')
  const selectedWorkspace = selectedWorkspaceId
    ? data?.workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null
    : null
  const visibleBoards = selectedWorkspaceId
    ? (data?.boards ?? []).filter((board) => board.workspaceId === selectedWorkspaceId)
    : (data?.recentBoards ?? [])
  const visibleDueSoonTasks = selectedWorkspaceId
    ? (data?.dueSoonTasks ?? []).filter((task) => task.workspaceId === selectedWorkspaceId)
    : (data?.dueSoonTasks ?? [])
  const visibleAssignedTasks = selectedWorkspaceId
    ? (data?.assignedTasks ?? []).filter((task) => task.workspaceId === selectedWorkspaceId)
    : (data?.assignedTasks ?? [])
  const visibleBoardIds = new Set(visibleBoards.map((board) => board.id))
  const visibleNotifications = selectedWorkspaceId
    ? (data?.notifications ?? []).filter((notification) =>
        notification.href
          ? Array.from(visibleBoardIds).some((boardId) => notification.href?.includes(boardId))
          : true,
      )
    : (data?.notifications ?? [])
  const visibleActivityFeed = selectedWorkspaceId
    ? (data?.activityFeed ?? []).filter((activityItem) =>
        activityItem.href
          ? Array.from(visibleBoardIds).some((boardId) => activityItem.href?.includes(boardId))
          : activityItem.category === 'workspace',
      )
    : (data?.activityFeed ?? [])

  const stats = data
    ? [
        { label: 'Workspaces', value: data.summary.workspaceCount, icon: Briefcase },
        { label: 'Recent boards', value: data.summary.recentBoardCount, icon: FolderKanban },
        { label: 'Due soon', value: data.summary.dueSoonCount, icon: CalendarDays },
        { label: 'Assigned tasks', value: data.summary.assignedTaskCount, icon: ListTodo },
      ]
    : []

  return (
    <>
      <DashboardPageIntro
        eyebrow="Overview"
        title={selectedWorkspace ? `${selectedWorkspace.name} overview` : `Welcome, ${displayName}`}
        description={
          selectedWorkspace
            ? `Focused on ${selectedWorkspace.name}. Review boards, due work, assignments, and recent updates for this workspace.`
            : 'Track your workspaces, follow board activity, and stay ahead of deadlines from a single professional dashboard.'
        }
        actions={
          <>
            {selectedWorkspace ? (
              <Link className="home-button" to={ROUTES.dashboard}>
                All workspaces
              </Link>
            ) : null}
            <button
              type="button"
              className="auth-submit auth-submit-secondary"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </>
        }
      />

      {data?.warnings.length ? (
        <section className="dashboard-banner" role="status" aria-live="polite">
          <div>
            <strong>Some dashboard sections are using fallbacks.</strong>
            <p>{data.warnings[0]}</p>
          </div>
        </section>
      ) : null}

      <section className="dashboard-stats-grid" aria-label="Workspace summary">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <article key={stat.label} className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="dashboard-card-label">{stat.label}</p>
                <strong>{stat.value}</strong>
              </div>
            </article>
          )
        })}
      </section>

      {isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading your dashboard</h2>
          <p>We are gathering the latest workspace, board, task, and activity data.</p>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Dashboard data could not be loaded</h2>
          <p>Try refreshing the dashboard. If the problem continues, check your Supabase connection and policies.</p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <section className="dashboard-sections-grid" aria-label="Overview details">
          <DashboardSection
            eyebrow="Workspace access"
            title="Your workspaces"
            description="Every workspace your current session can access is listed here with role context when available."
            action={
              <Link className="dashboard-inline-link" to={ROUTES.dashboardWorkspaces}>
                View all
              </Link>
            }
          >
            <WorkspaceList workspaces={data.workspaces} />
          </DashboardSection>

          <DashboardSection
            eyebrow="Board visibility"
            title="Recent boards"
            description="Boards are sorted by the latest update we could derive from the current accessible data."
            action={
              <Link className="dashboard-inline-link" to={ROUTES.dashboardBoards}>
                View boards
              </Link>
            }
          >
            <BoardList boards={visibleBoards} />
          </DashboardSection>

          <DashboardSection
            eyebrow="Deadlines"
            title="Tasks due soon"
            description="Overdue tasks and work due within the next seven days are surfaced first."
          >
            <TaskList
              tasks={visibleDueSoonTasks}
              emptyMessage="No overdue or upcoming tasks are visible right now."
            />
          </DashboardSection>

          <DashboardSection
            eyebrow="Assigned work"
            title="Assigned tasks"
            description="Tasks assigned to you are grouped here for quick access and deadline review."
          >
            <TaskList
              tasks={visibleAssignedTasks}
              emptyMessage="No tasks are assigned to you right now."
            />
          </DashboardSection>

          <DashboardSection
            eyebrow="Recent signals"
            title="Notifications"
            description="Recent notifications use the notification system when available and fall back to live task and board signals when needed."
            action={
              <span className="dashboard-section-icon" aria-hidden="true">
                <Bell size={18} />
              </span>
            }
          >
            <NotificationList notifications={visibleNotifications} />
          </DashboardSection>

          <DashboardSection
            eyebrow="Recent activity"
            title="Activity feed"
            description="Activity pulls from existing activity data when available, then derives a feed from current boards, tasks, and workspaces."
            action={
              <span className="dashboard-section-icon" aria-hidden="true">
                <Rows3 size={18} />
              </span>
            }
          >
            <ActivityFeedList activityFeed={visibleActivityFeed} />
          </DashboardSection>
        </section>
      ) : null}
    </>
  )
}

export default DashboardOverviewPage
