import type { PropsWithChildren } from 'react'

function AuthLayout({ children }: PropsWithChildren) {
  return (
    <section data-layout="auth" className="auth-layout">
      <div className="auth-layout-glow auth-layout-glow-primary" aria-hidden="true" />
      <div className="auth-layout-glow auth-layout-glow-secondary" aria-hidden="true" />
      <div className="auth-layout-grid" aria-hidden="true" />
      {children}
    </section>
  )
}

export default AuthLayout
