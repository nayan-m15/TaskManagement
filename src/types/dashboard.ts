export interface DashboardWorkspace {
  id: string
  name: string
  role?: string
  createdAt?: string
  updatedAt?: string
}

export interface DashboardBoard {
  id: string
  name: string
  title?: string
  workspaceId?: string
  workspaceName?: string
  createdAt?: string
  updatedAt?: string
}

export interface DashboardTask {
  id: string
  title: string
  description?: string
  boardId?: string
  boardName?: string
  workspaceId?: string
  columnId?: string
  columnName?: string
  status?: string
  priority?: string
  dueDate?: string
  assigneeId?: string
  createdById?: string
  createdAt?: string
  updatedAt?: string
}

export interface DashboardNotification {
  id: string
  title: string
  description: string
  category: 'assignment' | 'reminder' | 'comment' | 'invite' | 'board' | 'status'
  createdAt?: string
  href?: string
}

export interface DashboardActivityItem {
  id: string
  title: string
  description: string
  category: 'task' | 'comment' | 'board' | 'workspace'
  createdAt?: string
  href?: string
}

export interface DashboardSummaryStats {
  workspaceCount: number
  recentBoardCount: number
  dueSoonCount: number
  assignedTaskCount: number
}

export interface DashboardData {
  workspaces: DashboardWorkspace[]
  boards: DashboardBoard[]
  tasks: DashboardTask[]
  recentBoards: DashboardBoard[]
  dueSoonTasks: DashboardTask[]
  assignedTasks: DashboardTask[]
  notifications: DashboardNotification[]
  activityFeed: DashboardActivityItem[]
  summary: DashboardSummaryStats
  warnings: string[]
}

export interface DashboardProfile {
  id: string
  email?: string | null
  username?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  bio?: string | null
}

export interface DashboardProfileSettings {
  profile: DashboardProfile
  supported: boolean
  canEdit: boolean
  warnings: string[]
}

export interface DashboardBoardDetail {
  board: DashboardBoard | null
  tasks: DashboardTask[]
}
