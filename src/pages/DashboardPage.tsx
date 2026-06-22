import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Rows3,
  Settings,
  X,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import ThemeToggle from '../components/ThemeToggle'
import CreateBoardModal from '../components/dashboard/CreateBoardModal'
import CreateTaskButton from '../components/dashboard/CreateTaskButton'
import CreateTaskModal from '../components/dashboard/CreateTaskModal'
import CreateWorkspaceModal from '../components/dashboard/CreateWorkspaceModal'
import { useAuth } from '../hooks/useAuth'
import { useDashboardData } from '../hooks/useDashboardData'
import { logout } from '../services/authService'
import { ROUTES } from '../routes/routeConstants'
import type { DashboardOutletContextValue } from './dashboard/dashboardContext'

const dashboardNavItems: Array<{
  to: string
  label: string
  icon: typeof LayoutDashboard
  end: boolean
}> = [
  { to: ROUTES.dashboard, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: ROUTES.dashboardWorkspaces, label: 'Workspaces', icon: Briefcase, end: false },
  { to: ROUTES.dashboardBoards, label: 'Boards', icon: FolderKanban, end: false },
  { to: ROUTES.dashboardTasks, label: 'Tasks', icon: ListTodo, end: false },
  { to: ROUTES.dashboardCalendar, label: 'Due soon', icon: CalendarDays, end: false },
  { to: ROUTES.dashboardNotifications, label: 'Notifications', icon: Bell, end: false },
  { to: ROUTES.dashboardActivity, label: 'Activity', icon: Rows3, end: false },
  { to: ROUTES.dashboardSettings, label: 'Settings', icon: Settings, end: false },
]

function DashboardPage() {
  const navigate = useNavigate()
  const { session, clearSession } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false)
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [boardWorkspaceId, setBoardWorkspaceId] = useState<string | undefined>(undefined)
  const [dashboardFeedback, setDashboardFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const dashboardQuery = useDashboardData(session?.user.id)

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

  if (!session) {
    return null
  }

  function openCreateWorkspace() {
    setDashboardFeedback(null)
    setIsCreateWorkspaceOpen(true)
  }

  function openCreateBoard(workspaceId?: string) {
    setDashboardFeedback(null)
    setBoardWorkspaceId(workspaceId)
    setIsCreateBoardOpen(true)
  }

  function openCreateTask() {
    setDashboardFeedback(null)
    setIsCreateTaskOpen(true)
  }

  const outletContext: DashboardOutletContextValue = {
    session,
    displayName,
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    isFetching: dashboardQuery.isFetching,
    refetch: dashboardQuery.refetch,
    isLoggingOut,
    logoutError,
    openCreateWorkspace,
    openCreateBoard,
    openCreateTask,
  }

  return (
    <DashboardLayout showToolbar={false}>
      <div className="dashboard-app-shell">
        <div className="dashboard-app-mobilebar">
          <button
            type="button"
            className="dashboard-mobile-toggle"
            onClick={() => setIsNavOpen((value) => !value)}
            aria-label={isNavOpen ? 'Close dashboard navigation' : 'Open dashboard navigation'}
            aria-expanded={isNavOpen}
          >
            {isNavOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
          <div>
            <p className="dashboard-sidebar-label">TaskFlow</p>
            <strong>Dashboard</strong>
          </div>
          <ThemeToggle />
        </div>

        <div className={`dashboard-app-frame${isNavOpen ? ' dashboard-app-frame-nav-open' : ''}`}>
          <aside className="dashboard-app-sidebar" aria-label="Dashboard navigation">
            <div className="dashboard-sidebar-brand">
              <p className="dashboard-sidebar-label">TaskFlow</p>
              <h2>Workspace hub</h2>
              <p>Move between overview, workspaces, boards, tasks, and account settings without losing context.</p>
            </div>

            <nav className="dashboard-nav">
              {dashboardNavItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsNavOpen(false)}
                    className={({ isActive }) =>
                      `dashboard-nav-item${isActive ? ' dashboard-nav-item-active' : ''}`
                    }
                  >
                    <span className="dashboard-nav-icon" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            <div className="dashboard-sidebar-card">
              <p className="dashboard-sidebar-label">Signed in as</p>
              <strong>{session.user.email ?? 'Unknown email'}</strong>
              <p>{displayName}</p>
            </div>
          </aside>

          <main className="dashboard-app-main">
            <div className="dashboard-app-toolbar">
              <div className="dashboard-app-toolbar-copy">
                <p className="dashboard-sidebar-label">Authenticated workspace</p>
                <strong>{displayName}</strong>
              </div>
              <div className="dashboard-app-toolbar-actions">
                <ThemeToggle />
                <button
                  type="button"
                  className="auth-submit auth-submit-secondary"
                  onClick={openCreateWorkspace}
                >
                  Create Workspace
                </button>
                <button
                  type="button"
                  className="auth-submit auth-submit-secondary"
                  onClick={() => openCreateBoard()}
                >
                  Create Board
                </button>
                <CreateTaskButton
                  onClick={openCreateTask}
                  disabled={false}
                />
                <button
                  type="button"
                  className="auth-submit auth-submit-secondary"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut size={16} aria-hidden="true" />
                  {isLoggingOut ? 'Signing out...' : 'Logout'}
                </button>
              </div>
            </div>

            <div className="dashboard-route-content">
              {dashboardFeedback ? (
                <p
                  className={`auth-message ${
                    dashboardFeedback.tone === 'success'
                      ? 'auth-message-success'
                      : 'auth-message-error'
                  }`}
                  role={dashboardFeedback.tone === 'success' ? 'status' : 'alert'}
                >
                  {dashboardFeedback.message}
                </p>
              ) : null}
              <Outlet context={outletContext} />
              {logoutError ? (
                <p className="auth-message auth-message-error" role="alert">
                  {logoutError}
                </p>
              ) : null}
            </div>
          </main>
        </div>
      </div>

      <CreateTaskModal
        userId={session.user.id}
        workspaces={dashboardQuery.data?.workspaces ?? []}
        boards={dashboardQuery.data?.boards ?? []}
        isDashboardLoading={dashboardQuery.isLoading}
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onRequestCreateWorkspace={() => {
          setIsCreateTaskOpen(false)
          openCreateWorkspace()
        }}
        onRequestCreateBoard={(workspaceId) => {
          setIsCreateTaskOpen(false)
          openCreateBoard(workspaceId)
        }}
      />

      <CreateWorkspaceModal
        userId={session.user.id}
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
        onCreated={(workspaceName) => {
          setDashboardFeedback({
            tone: 'success',
            message: `Workspace "${workspaceName}" is ready.`,
          })
        }}
      />

      <CreateBoardModal
        userId={session.user.id}
        workspaces={dashboardQuery.data?.workspaces ?? []}
        isOpen={isCreateBoardOpen}
        initialWorkspaceId={boardWorkspaceId}
        onClose={() => {
          setIsCreateBoardOpen(false)
          setBoardWorkspaceId(undefined)
        }}
        onRequestCreateWorkspace={() => {
          setIsCreateBoardOpen(false)
          openCreateWorkspace()
        }}
        onCreated={(boardName) => {
          setDashboardFeedback({
            tone: 'success',
            message: `Board "${boardName}" was created with default columns.`,
          })
        }}
      />
    </DashboardLayout>
  )
}

export default DashboardPage
