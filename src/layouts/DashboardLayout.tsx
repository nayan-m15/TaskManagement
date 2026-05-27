import type { PropsWithChildren } from 'react'

function DashboardLayout({ children }: PropsWithChildren) {
  return <section data-layout="dashboard">{children}</section>
}

export default DashboardLayout
