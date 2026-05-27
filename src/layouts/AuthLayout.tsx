import type { PropsWithChildren } from 'react'

function AuthLayout({ children }: PropsWithChildren) {
  return <section data-layout="auth">{children}</section>
}

export default AuthLayout
