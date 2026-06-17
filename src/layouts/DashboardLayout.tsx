import type { PropsWithChildren } from 'react'
import ThemeToggle from '../components/ThemeToggle'

function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <section data-layout="dashboard" className="dashboard-layout">
        <div className="layout-toolbar">
          <ThemeToggle />
        </div>
        {children}
      </section>
    </div>
  )
}

export default DashboardLayout
