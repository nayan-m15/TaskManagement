import { useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
import { getCurrentSession, subscribeToAuthChanges } from './services/authService'
import { useAuthStore } from './store/authStore'

function App() {
  useEffect(() => {
    const { setLoading, setSession, clearSession, markInitialized } =
      useAuthStore.getState()

    let isActive = true
    let unsubscribe = () => {}

    setLoading(true)

    void getCurrentSession()
      .then((session) => {
        if (!isActive) {
          return
        }

        if (session) {
          setSession(session)
          return
        }

        clearSession()
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        clearSession()
      })
      .finally(() => {
        if (!isActive) {
          return
        }

        markInitialized()
      })

    try {
      unsubscribe = subscribeToAuthChanges((session) => {
        if (!isActive) {
          return
        }

        if (session) {
          setSession(session)
          return
        }

        clearSession()
      })
    } catch {
      clearSession()
      markInitialized()
    }

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  return <AppRoutes />
}

export default App
