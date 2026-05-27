import apiClient from './client'
import type { ApiResponse } from '../types/api'
import type { AuthCredentials, AuthSession } from '../types/auth'

export async function loginRequest(
  credentials: AuthCredentials,
): Promise<ApiResponse<AuthSession>> {
  return apiClient<AuthSession>({
    method: 'POST',
    url: '/auth/login',
    data: credentials,
  })
}

export async function registerRequest(
  credentials: AuthCredentials,
): Promise<ApiResponse<AuthSession>> {
  return apiClient<AuthSession>({
    method: 'POST',
    url: '/auth/register',
    data: credentials,
  })
}
