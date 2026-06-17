import type { PropsWithChildren } from 'react'

function MainLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <main className="main-layout">{children}</main>
    </div>
  )
}

export default MainLayout
