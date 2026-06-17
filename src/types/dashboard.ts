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
  boardId?: string
  boardName?: string
  workspaceId?: string
  columnId?: string
  columnName?: string
  status?: string
  priority?: string
  dueDate?: string
  assigneeId?: string
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
  recentBoards: DashboardBoard[]
  dueSoonTasks: DashboardTask[]
  assignedTasks: DashboardTask[]
  notifications: DashboardNotification[]
  activityFeed: DashboardActivityItem[]
  summary: DashboardSummaryStats
  warnings: string[]
}

export interface DashboardBoardDetail {
  board: DashboardBoard | null
  tasks: DashboardTask[]
}
