export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  board: '/dashboard/boards/:boardId',
} as const

export default ROUTES
