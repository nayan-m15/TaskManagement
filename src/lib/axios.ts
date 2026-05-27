import type { ApiRequestConfig, ApiResponse } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

interface RequestClient {
  request: <TResponse>(
    config: ApiRequestConfig,
  ) => Promise<ApiResponse<TResponse>>
}

export const axiosInstance: RequestClient = {
  async request<TResponse>(config: ApiRequestConfig) {
    const queryString = config.params
      ? `?${new URLSearchParams(
          Object.entries(config.params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        ).toString()}`
      : ''

    const response = await fetch(`${API_BASE_URL}${config.url}${queryString}`, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: config.data ? JSON.stringify(config.data) : undefined,
    })

    const text = await response.text()
    const data = text ? (JSON.parse(text) as TResponse) : (undefined as TResponse)

    return {
      data,
      status: response.status,
      message: response.ok ? undefined : response.statusText,
    }
  },
}

export default axiosInstance
