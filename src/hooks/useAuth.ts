import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const session = useAuthStore((state) => state.session)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  return {
    session,
    isAuthenticated,
    setSession,
    clearSession,
  }
}
