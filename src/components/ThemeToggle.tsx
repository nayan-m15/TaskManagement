import { Moon, SunMedium } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? <SunMedium size={16} /> : <Moon size={16} />}
      </span>
      <span className="theme-toggle-label">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

export default ThemeToggle
