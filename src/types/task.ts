import type { EntityMetadata } from './common'

export interface TaskComment extends EntityMetadata {
  body: string
  authorId: string
}

export interface Task extends EntityMetadata {
  title: string
  description?: string
  boardId: string
  columnId?: string
  assigneeId?: string
  comments?: TaskComment[]
}
