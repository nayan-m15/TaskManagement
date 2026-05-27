import axiosInstance from '../lib/axios'
import type { ApiRequestConfig, ApiResponse } from '../types/api'

export async function apiClient<TResponse>(
  config: ApiRequestConfig,
): Promise<ApiResponse<TResponse>> {
  return axiosInstance.request<TResponse>(config)
}

export default apiClient
