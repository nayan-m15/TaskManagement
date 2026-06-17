import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  FolderKanban,
  ListTodo,
  Rows3,
} from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardSection from '../components/dashboard/DashboardSection'
import { useAuth } from '../hooks/useAuth'
import { useDashboardData } from '../hooks/useDashboardData'
import { logout } from '../services/authService'
import { ROUTES } from '../routes/routeConstants'
import { formatDate } from '../utils/formatDate'
import type {
  DashboardActivityItem,
  DashboardBoard,
  DashboardNotification,
  DashboardTask,
  DashboardWorkspace,
} from '../types/dashboard'

const overviewSections = [
  { href: '#workspaces', label: 'Workspaces' },
  { href: '#recent-boards', label: 'Recent boards' },
  { href: '#due-soon', label: 'Due soon' },
  { href: '#assigned-tasks', label: 'Assigned tasks' },
  { href: '#notifications', label: 'Notifications' },
  { href: '#activity-feed', label: 'Activity feed' },
] as const

function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, clearSession } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const { data, isLoading, isError, refetch, isFetching } = useDashboardData(
    session?.user.id,
  )

  const displayName =
    session?.user.username || session?.user.fullName || session?.user.email || 'there'
  const selectedWorkspaceId = searchParams.get('workspace')
  const selectedWorkspace = selectedWorkspaceId
    ? data?.workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null
    : null
  const visibleBoards = selectedWorkspaceId
    ? (data?.recentBoards ?? []).filter((board) => board.workspaceId === selectedWorkspaceId)
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
        {
          label: 'Workspaces',
          value: data.summary.workspaceCount,
          icon: Briefcase,
        },
        {
          label: 'Recent boards',
          value: data.summary.recentBoardCount,
          icon: FolderKanban,
        },
        {
          label: 'Due soon',
          value: data.summary.dueSoonCount,
          icon: CalendarDays,
        },
        {
          label: 'Assigned tasks',
          value: data.summary.assignedTaskCount,
          icon: ListTodo,
        },
      ]
    : []

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
      <main className="dashboard-shell">
        <aside className="dashboard-sidebar" aria-label="Workspace navigation">
          <div className="dashboard-sidebar-brand">
            <p className="dashboard-sidebar-label">TaskFlow</p>
            <h2>Dashboard</h2>
            <p>Your current planning space with tasks, boards, and activity in one view.</p>
          </div>
          <nav className="dashboard-nav">
            {overviewSections.map((section, index) => (
              <a
                key={section.href}
                className={`dashboard-nav-item${index === 0 ? ' dashboard-nav-item-active' : ''}`}
                href={section.href}
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="dashboard-sidebar-card">
            <p className="dashboard-sidebar-label">Signed in as</p>
            <strong>{session?.user.email ?? 'Unknown email'}</strong>
            <p>{displayName}</p>
          </div>
        </aside>

        <div className="dashboard-main">
          <header id="overview" className="dashboard-header">
            <div>
              <p className="auth-eyebrow">Authenticated workspace</p>
              <h1>Welcome, {displayName}</h1>
              <p className="auth-copy">
                {selectedWorkspace
                  ? `Focused on ${selectedWorkspace.name}. Review the latest boards, tasks, and activity for this workspace.`
                  : 'Track your workspaces, follow the boards that changed recently, and stay ahead of due tasks from one calm, responsive dashboard.'}
              </p>
            </div>
            <div className="dashboard-header-actions">
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
              <button
                type="button"
                className="auth-submit auth-submit-secondary"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Signing out...' : 'Logout'}
              </button>
            </div>
          </header>

          {data?.warnings.length ? (
            <section className="dashboard-banner" role="status" aria-live="polite">
              <AlertTriangle size={18} aria-hidden="true" />
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
            <section className="dashboard-sections-grid" aria-label="Workspace details">
              <DashboardSection
                eyebrow="Workspace access"
                title="Your workspaces"
                description="Every workspace your current session can access is listed here with role context when available."
                action={
                  <span className="home-status-pill">
                    {selectedWorkspace ? 'Filtered view' : `${data.workspaces.length} total`}
                  </span>
                }
              >
                <WorkspaceList workspaces={data.workspaces} />
              </DashboardSection>

              <DashboardSection
                eyebrow="Board visibility"
                title="Recent boards"
                description="Boards are sorted by the latest update we could derive from the current accessible data."
                action={
                  <span className="home-status-pill">{visibleBoards.length} boards</span>
                }
              >
                <RecentBoardList boards={visibleBoards} />
              </DashboardSection>

              <DashboardSection
                eyebrow="Deadlines"
                title="Tasks due soon"
                description="Overdue tasks and work due within the next seven days are surfaced first."
              >
                <TaskList
                  id="due-soon"
                  ariaLabel="Tasks due soon"
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
                  id="assigned-tasks"
                  ariaLabel="Assigned tasks"
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

          {logoutError ? (
            <p className="auth-message auth-message-error" role="alert">
              {logoutError}
            </p>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  )
}

function WorkspaceList({ workspaces }: { workspaces: DashboardWorkspace[] }) {
  if (workspaces.length === 0) {
    return (
      <div id="workspaces" className="dashboard-empty-state">
        <h3>No workspaces yet</h3>
        <p>This account does not have any visible workspaces yet.</p>
      </div>
    )
  }

  return (
    <ul id="workspaces" className="dashboard-entity-list" aria-label="Workspaces">
      {workspaces.map((workspace) => (
        <li key={workspace.id} className="dashboard-entity-item">
          <div className="dashboard-item-heading">
            <div>
              <h3>{workspace.name}</h3>
              <div className="dashboard-meta-row">
                {workspace.role ? <span>Role: {workspace.role}</span> : <span>Member access</span>}
                {workspace.updatedAt ? <span>Updated {formatDate(workspace.updatedAt)}</span> : null}
              </div>
            </div>
            <Link
              className="dashboard-inline-link"
              to={`${ROUTES.dashboard}?workspace=${workspace.id}#recent-boards`}
            >
              Open workspace
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}

function RecentBoardList({ boards }: { boards: DashboardBoard[] }) {
  if (boards.length === 0) {
    return (
      <div id="recent-boards" className="dashboard-empty-state">
        <h3>No boards yet</h3>
        <p>Create or join a board and it will appear here once it is visible to your session.</p>
      </div>
    )
  }

  return (
    <ul id="recent-boards" className="dashboard-entity-list" aria-label="Recent boards">
      {boards.map((board) => (
        <li key={board.id} className="dashboard-entity-item">
          <div className="dashboard-item-heading">
            <div>
              <h3>{board.name}</h3>
              <div className="dashboard-meta-row">
                {board.workspaceName ? <span>{board.workspaceName}</span> : null}
                <span>
                  {board.updatedAt
                    ? `Updated ${formatDate(board.updatedAt)}`
                    : board.createdAt
                      ? `Created ${formatDate(board.createdAt)}`
                      : 'Date unavailable'}
                </span>
              </div>
            </div>
            <Link className="dashboard-inline-link" to={`/dashboard/boards/${board.id}`}>
              Open board
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}

function TaskList({
  id,
  ariaLabel,
  tasks,
  emptyMessage,
}: {
  id: string
  ariaLabel: string
  tasks: DashboardTask[]
  emptyMessage: string
}) {
  if (tasks.length === 0) {
    return (
      <div id={id} className="dashboard-empty-state">
        <h3>Nothing to review</h3>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul id={id} className="dashboard-task-list" aria-label={ariaLabel}>
      {tasks.map((task) => {
        const dueState = getDueState(task.dueDate)

        return (
          <li key={task.id} className="dashboard-task-item">
            <div className="dashboard-task-main">
              <div className="dashboard-item-heading">
                <div>
                  <h3>{task.title}</h3>
                  <div className="dashboard-meta-row">
                    {task.boardName ? <span>{task.boardName}</span> : null}
                    {task.columnName ? <span>{task.columnName}</span> : null}
                    {task.status ? <span>Status: {task.status}</span> : null}
                  </div>
                </div>
                <div className="dashboard-badge-row">
                  {task.priority ? (
                    <span className="dashboard-badge dashboard-badge-neutral">
                      {task.priority}
                    </span>
                  ) : null}
                  {dueState ? (
                    <span className={`dashboard-badge ${dueState.className}`}>
                      {dueState.label}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="dashboard-item-footer">
                <div className="dashboard-meta-row">
                  {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : <span>No due date</span>}
                </div>
                <div className="dashboard-link-row">
                  {task.boardId ? (
                    <Link
                      className="dashboard-inline-link"
                      to={`/dashboard/boards/${task.boardId}#task-${task.id}`}
                    >
                      Open task
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  ) : null}
                  {task.boardId ? (
                    <Link className="dashboard-inline-link" to={`/dashboard/boards/${task.boardId}`}>
                      Open board
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function NotificationList({
  notifications,
}: {
  notifications: DashboardNotification[]
}) {
  if (notifications.length === 0) {
    return (
      <div id="notifications" className="dashboard-empty-state">
        <h3>No recent notifications</h3>
        <p>New assignments, reminders, and updates will appear here when activity is available.</p>
      </div>
    )
  }

  return (
    <ul id="notifications" className="dashboard-feed-list" aria-label="Notifications">
      {notifications.map((notification) => (
        <li key={notification.id} className="dashboard-feed-item">
          <div>
            <div className="dashboard-item-heading">
              <h3>{notification.title}</h3>
              <span className="dashboard-badge dashboard-badge-neutral">
                {notification.category}
              </span>
            </div>
            <p>{notification.description}</p>
            <div className="dashboard-meta-row">
              {notification.createdAt ? <span>{formatDate(notification.createdAt)}</span> : null}
            </div>
          </div>
          {notification.href ? (
            <Link className="dashboard-inline-link" to={notification.href}>
              Open
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function ActivityFeedList({
  activityFeed,
}: {
  activityFeed: DashboardActivityItem[]
}) {
  if (activityFeed.length === 0) {
    return (
      <div id="activity-feed" className="dashboard-empty-state">
        <h3>No recent activity</h3>
        <p>Workspace and board activity will appear here when recent changes are available.</p>
      </div>
    )
  }

  return (
    <ul id="activity-feed" className="dashboard-feed-list" aria-label="Activity feed">
      {activityFeed.map((activityItem) => (
        <li key={activityItem.id} className="dashboard-feed-item">
          <div>
            <div className="dashboard-item-heading">
              <h3>{activityItem.title}</h3>
              <span className="dashboard-badge dashboard-badge-accent">
                {activityItem.category}
              </span>
            </div>
            <p>{activityItem.description}</p>
            <div className="dashboard-meta-row">
              {activityItem.createdAt ? <span>{formatDate(activityItem.createdAt)}</span> : null}
            </div>
          </div>
          {activityItem.href ? (
            <Link className="dashboard-inline-link" to={activityItem.href}>
              Open
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function getDueState(dueDate?: string) {
  if (!dueDate) {
    return null
  }

  const daysUntilDue = differenceInCalendarDays(parseISO(dueDate), new Date())

  if (daysUntilDue < 0) {
    return {
      label: 'Overdue',
      className: 'dashboard-badge-danger',
    }
  }

  if (daysUntilDue === 0) {
    return {
      label: 'Due today',
      className: 'dashboard-badge-warning',
    }
  }

  return {
    label: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
    className: 'dashboard-badge-success',
  }
}

export default DashboardPage
