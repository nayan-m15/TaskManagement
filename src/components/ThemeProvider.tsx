import {
  type PropsWithChildren,
  useEffect,
  useMemo,
} from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ThemeContext, type ThemeContextValue, type ThemeMode } from './themeContext'

const THEME_STORAGE_KEY = 'taskflow-theme'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(THEME_STORAGE_KEY, getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light'),
    }),
    [setTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
