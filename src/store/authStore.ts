import { create } from 'zustand'
import type { AuthSession } from '../types/auth'

interface AuthState {
  session: AuthSession | null
  isAuthenticated: boolean
  setSession: (session: AuthSession | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
  setSession: (session) =>
    set({
      session,
      isAuthenticated: Boolean(session),
    }),
  clearSession: () =>
    set({
      session: null,
      isAuthenticated: false,
    }),
}))
