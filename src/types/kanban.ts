export const DEFAULT_BOARD_COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'] as const

export const TASK_PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const

export type TaskPriority = (typeof TASK_PRIORITY_OPTIONS)[number]

export type TaskDueState = 'overdue' | 'due-today' | 'upcoming' | 'none'

export interface BoardAssignee {
  id: string
  username?: string
  email?: string
  avatarUrl?: string | null
  role?: string
}

export interface TaskLabel {
  id: string
  name: string
  color?: string | null
}

export interface TaskCommentAuthor {
  id: string
  username?: string
  email?: string
  avatarUrl?: string | null
}

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt?: string | null
  updatedAt?: string | null
  author?: TaskCommentAuthor | null
}

export interface TaskAttachment {
  id: string
  taskId: string
  fileUrl: string
  fileName?: string | null
  fileType?: string | null
  fileSize?: number | null
  storagePath?: string | null
  uploadedBy?: string | null
  uploadedAt?: string | null
  uploader?: TaskCommentAuthor | null
}

export interface TaskActivityEntry {
  id: string
  action: string
  taskId?: string | null
  userId?: string | null
  createdAt?: string | null
  actor?: TaskCommentAuthor | null
}

export interface BoardTask {
  id: string
  columnId: string
  title: string
  description?: string | null
  dueDate?: string | null
  priority?: TaskPriority | null
  assignedTo?: string | null
  position: number
  createdBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  assignee?: BoardAssignee | null
  labels: TaskLabel[]
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
  availableLabels: TaskLabel[]
}

export interface BoardTaskDetail extends BoardTask {
  boardId: string
  workspaceId: string
  workspaceName?: string
  columnTitle?: string
  attachments: TaskAttachment[]
  comments: TaskComment[]
  activity: TaskActivityEntry[]
  availableLabels: TaskLabel[]
  warnings: string[]
  supports: {
    attachments: boolean
    attachmentUpload: boolean
    comments: boolean
    activity: boolean
    labels: boolean
  }
}

export interface TaskFormValues {
  title: string
  description: string
  dueDate: string
  priority: '' | TaskPriority
  assignedTo: string
  columnId: string
  labelIds: string[]
}

export interface TaskMutationInput {
  title: string
  description?: string | null
  dueDate?: string | null
  priority?: TaskPriority | null
  assignedTo?: string | null
  columnId: string
  labelIds: string[]
}

export interface ReorderTaskPosition {
  id: string
  columnId: string
  position: number
}

export interface CreateTaskLabelInput {
  name: string
  color?: string | null
}
