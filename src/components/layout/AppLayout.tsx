import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface AppLayoutProps {
  children: ReactNode
  topbarPlaceholder?: string
  hasNotification?: boolean
  hasWishlist?: boolean
}

export default function AppLayout({
  children,
  topbarPlaceholder,
  hasNotification,
  hasWishlist,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar
          placeholder={topbarPlaceholder}
          hasNotification={hasNotification}
          hasWishlist={hasWishlist}
        />
        <main className="content-area">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  )
}
