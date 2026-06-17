import type { PropsWithChildren } from 'react'
import ThemeToggle from '../components/ThemeToggle'

interface DashboardLayoutProps extends PropsWithChildren {
  showToolbar?: boolean
}

function DashboardLayout({
  children,
  showToolbar = true,
}: DashboardLayoutProps) {
  return (
    <div className="app-shell">
      <section data-layout="dashboard" className="dashboard-layout">
        {showToolbar ? (
          <div className="layout-toolbar">
            <ThemeToggle />
          </div>
        ) : null}
        {children}
      </section>
    </div>
  )
}

export default DashboardLayout
