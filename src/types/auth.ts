export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends AuthCredentials {
  username: string
}

export interface AuthUser {
  id: string
  email: string | null
  username?: string
  fullName?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  user: AuthUser
}

export interface AuthStateSnapshot {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
}
