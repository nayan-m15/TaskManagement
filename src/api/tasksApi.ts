import apiClient from './client'
import type { ApiResponse } from '../types/api'
import type { Task } from '../types/task'

export async function fetchTasksRequest(): Promise<ApiResponse<Task[]>> {
  return apiClient<Task[]>({
    method: 'GET',
    url: '/tasks',
  })
}
