import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface AppLayoutProps {
  children: ReactNode
  topbarPlaceholder?: string
  hasWishlist?: boolean
}

export default function AppLayout({
  children,
  topbarPlaceholder,
  hasWishlist,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar
          placeholder={topbarPlaceholder}
          hasWishlist={hasWishlist}
        />
        <main className="content-area">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  )
}
