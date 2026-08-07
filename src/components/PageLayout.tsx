import type { ReactNode } from 'react'

type PageLayoutProps = {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="app-shell">
      {children}
    </div>
  )
}
