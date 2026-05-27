import type { EntityMetadata } from './common'

export interface BoardColumn extends EntityMetadata {
  title: string
  order: number
}

export interface Board extends EntityMetadata {
  name: string
  description?: string
  columns: BoardColumn[]
}
