export const DEFAULT_BOARD_COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'] as const

export const TASK_PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const

export type TaskPriority = (typeof TASK_PRIORITY_OPTIONS)[number]

export interface BoardAssignee {
  id: string
  username?: string
  email?: string
  avatarUrl?: string | null
  role?: string
}

export interface BoardTask {
  id: string
  columnId: string
  title: string
  description?: string | null
  dueDate?: string | null
  priority?: string | null
  assignedTo?: string | null
  position: number
  createdBy?: string | null
  createdAt?: string | null
  assignee?: BoardAssignee | null
}

export interface BoardColumn {
  id: string
  boardId: string
  title: string
  position: number
  tasks: BoardTask[]
}

export interface BoardDetails {
  id: string
  title: string
  workspaceId: string
  workspaceName?: string
  createdBy: string
  createdAt?: string | null
  columns: BoardColumn[]
  members: BoardAssignee[]
}

export interface TaskFormValues {
  title: string
  description: string
  dueDate: string
  priority: '' | TaskPriority
  assignedTo: string
  columnId: string
}

export interface TaskMutationInput {
  title: string
  description?: string | null
  dueDate?: string | null
  priority?: string | null
  assignedTo?: string | null
  columnId: string
}

export interface ReorderTaskPosition {
  id: string
  columnId: string
  position: number
}
