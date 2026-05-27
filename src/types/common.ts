export interface EntityMetadata {
  id: string
  createdAt?: string
  updatedAt?: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}
