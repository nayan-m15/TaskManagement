import { create } from 'zustand'
import type { AuthSession } from '../types/auth'

interface AuthState {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  setSession: (session: AuthSession | null) => void
  setLoading: (isLoading: boolean) => void
  markInitialized: () => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  setSession: (session) =>
    set({
      session,
      isAuthenticated: Boolean(session),
      isLoading: false,
      isInitialized: true,
    }),
  setLoading: (isLoading) =>
    set({
      isLoading,
    }),
  markInitialized: () =>
    set({
      isLoading: false,
      isInitialized: true,
    }),
  clearSession: () =>
    set({
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    }),
}))
