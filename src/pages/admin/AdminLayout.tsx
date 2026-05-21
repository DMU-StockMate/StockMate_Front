import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: 'bi-grid', label: '대시보드' },
  { path: '/admin/users', icon: 'bi-people', label: '회원 관리' },
  { path: '/admin/stocks', icon: 'bi-bar-chart', label: '종목 관리' },
]

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { adminUser, adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  const handle_logout = () => {
    adminLogout()
    navigate('/admin')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: 240, height: '100%', background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 24px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16,
          }}>S</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>StockMate</div>
            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>관리자 콘솔</div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                height: 44, display: 'flex', alignItems: 'center', gap: 12,
                padding: '0 14px', borderRadius: 10, textDecoration: 'none',
                fontWeight: isActive ? 700 : 500, fontSize: 14,
                color: isActive ? 'var(--primary)' : 'var(--t2)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                transition: 'background 0.15s',
              })}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: 16, width: 18, textAlign: 'center' }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--t2)' }}>
            <div style={{ fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>{adminUser?.name}</div>
            <div>{adminUser?.email}</div>
          </div>
          <button
            onClick={handle_logout}
            style={{
              width: '100%', height: 40, display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--up)', fontWeight: 500, fontSize: 14,
            }}
          >
            <i className="bi bi-box-arrow-right" />
            로그아웃
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          height: 64, borderBottom: '1px solid var(--border)', background: '#fff',
          display: 'flex', alignItems: 'center', padding: '0 32px',
          gap: 12,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>
            {title ?? 'StockMate 관리자'}
          </h1>
          <div style={{
            marginLeft: 'auto', fontSize: 12, padding: '4px 10px',
            borderRadius: 20, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600,
          }}>
            ADMIN
          </div>
        </div>
        <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
