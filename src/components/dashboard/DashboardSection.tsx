import type { PropsWithChildren, ReactNode } from 'react'

interface DashboardSectionProps extends PropsWithChildren {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

function DashboardSection({
  eyebrow,
  title,
  description,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section className="dashboard-section-card">
      <header className="dashboard-section-header">
        <div>
          <p className="dashboard-card-label">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action ? <div className="dashboard-section-action">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}

export default DashboardSection
