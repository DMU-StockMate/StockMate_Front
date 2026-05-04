import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

interface NavItemDef {
  path: string
  label: string
  icon: string
  subItems?: { path: string; label: string }[]
}

const NAV_ITEMS: NavItemDef[] = [
  { path: '/dashboard', label: '홈', icon: 'bi-house-fill' },
  {
    path: '/learn',
    label: '투자학습',
    icon: 'bi-journal-text',
    subItems: [
      { path: '/learn', label: '전체 보기' },
      { path: '/learn/beginner', label: '초급' },
      { path: '/learn/intermediate', label: '중급' },
      { path: '/learn/advanced', label: '고급' },
      { path: '/learn/custom', label: '개인 맞춤' },
      { path: '/learn/favorites', label: '찜한 문제' },
    ],
  },
  { path: '/ai', label: 'AI 분석', icon: 'bi-cpu' },
  { path: '/trade', label: '모의투자', icon: 'bi-graph-up-arrow' },
  { path: '/mypage', label: '마이페이지', icon: 'bi-person-circle' },
]

const OPTIONAL_NAV: NavItemDef[] = [
  { path: '/news', label: '뉴스', icon: 'bi-newspaper' },
  { path: '/ranking', label: '랭킹 & 커뮤니티', icon: 'bi-trophy' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn, user, logout } = useAuth()
  const [openSubs, setOpenSubs] = useState<string[]>(['/learn'])

  const toggleSub = (path: string) => {
    setOpenSubs((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }

  const isParentActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">S</div>
        <div className="logo-name">StockMate</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active = isParentActive(item.path)
          const subOpen = openSubs.includes(item.path)

          return (
            <div key={item.path}>
              {item.subItems ? (
                <div
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => toggleSub(item.path)}
                  style={{ userSelect: 'none' }}
                >
                  <i className={`bi ${item.icon} nav-icon`} />
                  {item.label}
                  <i
                    className={`bi ${subOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                    style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--t3)' }}
                  />
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon} nav-icon`} />
                  {item.label}
                </NavLink>
              )}

              {item.subItems && subOpen && (
                <div className="sub-nav">
                  {item.subItems.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      end
                      className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                    >
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="nav-divider" />
        <div className="nav-section">선택</div>

        {OPTIONAL_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon} nav-icon`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {isLoggedIn ? (
          <>
            <div className="avatar-sm" />
            <div style={{ flex: 1 }}>
              <div className="user-name">{user?.name ?? '사용자'}</div>
              <div className="user-level">{user?.level ?? '-'}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--t3)',
                fontSize: 18,
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
              }}
              title="로그아웃"
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--primary)',
              textDecoration: 'none',
              flex: 1,
            }}
          >
            <i className="bi bi-box-arrow-in-right" style={{ fontSize: 16 }} />
            로그인 / 회원가입
          </NavLink>
        )}
      </div>
    </aside>
  )
}
