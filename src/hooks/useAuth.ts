import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const session = useAuthStore((state) => state.session)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const setSession = useAuthStore((state) => state.setSession)
  const setLoading = useAuthStore((state) => state.setLoading)
  const markInitialized = useAuthStore((state) => state.markInitialized)
  const clearSession = useAuthStore((state) => state.clearSession)

  return {
    session,
    isAuthenticated,
    isLoading,
    isInitialized,
    setSession,
    setLoading,
    markInitialized,
    clearSession,
  }
}
