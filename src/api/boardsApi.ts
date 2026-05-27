import apiClient from './client'
import type { ApiResponse } from '../types/api'
import type { Board } from '../types/board'

export async function fetchBoardsRequest(): Promise<ApiResponse<Board[]>> {
  return apiClient<Board[]>({
    method: 'GET',
    url: '/boards',
  })
}
