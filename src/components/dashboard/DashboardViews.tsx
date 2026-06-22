import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '../../routes/routeConstants'
import { getDueState } from '../../utils/dashboardDueState'
import { formatDate } from '../../utils/formatDate'
import type {
  DashboardActivityItem,
  DashboardBoard,
  DashboardNotification,
  DashboardTask,
  DashboardWorkspace,
} from '../../types/dashboard'

export function DashboardPageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-copy">{description}</p>
      </div>
      {actions ? <div className="dashboard-header-actions">{actions}</div> : null}
    </header>
  )
}

export function DashboardEmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="dashboard-empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  )
}

export function WorkspaceList({
  workspaces,
  workspaceTaskCounts,
  workspaceBoardCounts,
  onCreateWorkspace,
  onCreateBoard,
}: {
  workspaces: DashboardWorkspace[]
  workspaceTaskCounts?: Map<string, number>
  workspaceBoardCounts?: Map<string, number>
  onCreateWorkspace?: () => void
  onCreateBoard?: (workspaceId?: string) => void
}) {
  if (workspaces.length === 0) {
    return (
      <DashboardEmptyState
        title="No workspaces yet"
        message="Create a workspace first so you can add boards and then start creating tasks."
        action={
          <button type="button" className="auth-submit" onClick={onCreateWorkspace}>
            Create Workspace
          </button>
        }
      />
    )
  }

  return (
    <ul className="dashboard-entity-list" aria-label="Workspaces">
      {workspaces.map((workspace) => (
        <li key={workspace.id} className="dashboard-entity-item">
          <div className="dashboard-item-heading">
            <div>
              <h3>{workspace.name}</h3>
              <div className="dashboard-meta-row">
                {workspace.role ? <span>Role: {workspace.role}</span> : <span>Member access</span>}
                {workspace.updatedAt ? <span>Updated {formatDate(workspace.updatedAt)}</span> : null}
                {typeof workspaceBoardCounts?.get(workspace.id) === 'number' ? (
                  <span>{workspaceBoardCounts.get(workspace.id)} boards</span>
                ) : null}
                {typeof workspaceTaskCounts?.get(workspace.id) === 'number' ? (
                  <span>{workspaceTaskCounts.get(workspace.id)} tasks</span>
                ) : null}
              </div>
            </div>
            <Link
              className="dashboard-inline-link"
              to={`${ROUTES.dashboardBoards}?workspace=${workspace.id}`}
            >
              Open boards
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="dashboard-link-row">
            <button
              type="button"
              className="auth-submit auth-submit-secondary dashboard-inline-action"
              onClick={() => onCreateBoard?.(workspace.id)}
            >
              Create Board
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function BoardList({
  boards,
  taskCountsByBoardId,
  onCreateBoard,
}: {
  boards: DashboardBoard[]
  taskCountsByBoardId?: Map<string, number>
  onCreateBoard?: () => void
}) {
  if (boards.length === 0) {
    return (
      <DashboardEmptyState
        title="No boards yet"
        message="Create a board inside a workspace before adding tasks."
        action={
          <button type="button" className="auth-submit" onClick={onCreateBoard}>
            Create Board
          </button>
        }
      />
    )
  }

  return (
    <ul className="dashboard-entity-list" aria-label="Boards">
      {boards.map((board) => (
        <li key={board.id} className="dashboard-entity-item">
          <div className="dashboard-item-heading">
            <div>
              <h3>{board.name}</h3>
              <div className="dashboard-meta-row">
                {board.workspaceName ? <span>{board.workspaceName}</span> : null}
                {typeof taskCountsByBoardId?.get(board.id) === 'number' ? (
                  <span>{taskCountsByBoardId.get(board.id)} tasks</span>
                ) : null}
                <span>
                  {board.updatedAt
                    ? `Updated ${formatDate(board.updatedAt)}`
                    : board.createdAt
                      ? `Created ${formatDate(board.createdAt)}`
                      : 'Date unavailable'}
                </span>
              </div>
            </div>
            <Link className="dashboard-inline-link" to={ROUTES.boardDetail(board.id)}>
              Open board
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function TaskList({
  tasks,
  emptyTitle,
  emptyMessage,
}: {
  tasks: DashboardTask[]
  emptyTitle?: string
  emptyMessage: string
}) {
  if (tasks.length === 0) {
    return (
      <DashboardEmptyState
        title={emptyTitle ?? 'Nothing to review'}
        message={emptyMessage}
      />
    )
  }

  return (
    <ul className="dashboard-task-list" aria-label="Tasks">
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
              {task.description ? <p className="dashboard-task-description">{task.description}</p> : null}
              <div className="dashboard-item-footer">
                <div className="dashboard-meta-row">
                  {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : <span>No due date</span>}
                  {task.updatedAt ? <span>Updated {formatDate(task.updatedAt)}</span> : null}
                </div>
                <div className="dashboard-link-row">
                  {task.boardId ? (
                    <Link
                      className="dashboard-inline-link"
                      to={`${ROUTES.boardDetail(task.boardId)}#task-${task.id}`}
                    >
                      Open task
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  ) : null}
                  {task.boardId ? (
                    <Link className="dashboard-inline-link" to={ROUTES.boardDetail(task.boardId)}>
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

export function NotificationList({
  notifications,
}: {
  notifications: DashboardNotification[]
}) {
  if (notifications.length === 0) {
    return (
      <DashboardEmptyState
        title="No recent notifications"
        message="New assignments, reminders, and updates will appear here when activity is available."
      />
    )
  }

  return (
    <ul className="dashboard-feed-list" aria-label="Notifications">
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

export function ActivityFeedList({
  activityFeed,
}: {
  activityFeed: DashboardActivityItem[]
}) {
  if (activityFeed.length === 0) {
    return (
      <DashboardEmptyState
        title="No recent activity"
        message="Workspace and board activity will appear here when recent changes are available."
      />
    )
  }

  return (
    <ul className="dashboard-feed-list" aria-label="Activity feed">
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
