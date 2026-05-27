export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  fullName?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  user: AuthUser
}
