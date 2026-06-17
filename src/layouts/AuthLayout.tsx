import type { PropsWithChildren } from 'react'
import ThemeToggle from '../components/ThemeToggle'

function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <section data-layout="auth" className="auth-layout">
        <div className="layout-toolbar">
          <ThemeToggle />
        </div>
        {children}
      </section>
    </div>
  )
}

export default AuthLayout
