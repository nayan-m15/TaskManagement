import { Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import DashboardPage from '../pages/DashboardPage'
import BoardPage from '../pages/BoardPage'
import NotFoundPage from '../pages/NotFoundPage'
import DashboardOverviewPage from '../pages/dashboard/DashboardOverviewPage'
import WorkspacesPage from '../pages/dashboard/WorkspacesPage'
import BoardsPage from '../pages/dashboard/BoardsPage'
import TasksPage from '../pages/dashboard/TasksPage'
import CalendarPage from '../pages/dashboard/CalendarPage'
import NotificationsPage from '../pages/dashboard/NotificationsPage'
import ActivityPage from '../pages/dashboard/ActivityPage'
import SettingsPage from '../pages/dashboard/SettingsPage'
import ProtectedRoute from './ProtectedRoute'
import { ROUTES } from './routeConstants'

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomePage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route
        path={ROUTES.dashboard}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverviewPage />} />
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="boards" element={<BoardsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route
        path={ROUTES.board}
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
