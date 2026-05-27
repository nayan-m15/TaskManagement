import { loginRequest, registerRequest } from '../api/authApi'
import type { AuthCredentials } from '../types/auth'

export async function login(credentials: AuthCredentials) {
  return loginRequest(credentials)
}

export async function register(credentials: AuthCredentials) {
  return registerRequest(credentials)
}
