export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  dashboardWorkspaces: '/dashboard/workspaces',
  dashboardBoards: '/dashboard/boards',
  dashboardTasks: '/dashboard/tasks',
  dashboardCalendar: '/dashboard/calendar',
  dashboardNotifications: '/dashboard/notifications',
  dashboardActivity: '/dashboard/activity',
  dashboardSettings: '/dashboard/settings',
  board: '/dashboard/boards/:boardId',
  boardDetail: (boardId: string) => `/dashboard/boards/${boardId}`,
} as const

export default ROUTES
