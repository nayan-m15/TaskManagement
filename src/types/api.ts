export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  data?: unknown
  params?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
}

export interface ApiResponse<TData> {
  data: TData
  status: number
  message?: string
}
