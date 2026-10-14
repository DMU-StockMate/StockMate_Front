import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import ProfileAvatar from '../common/ProfileAvatar'

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
      { path: '/learn/concepts', label: '개념정리' },
      { path: '/learn/beginner', label: '초급' },
      { path: '/learn/intermediate', label: '중급' },
      { path: '/learn/advanced', label: '고급' },
      { path: '/learn/custom', label: '개인 맞춤' },
      { path: '/learn/ai-history', label: 'AI 질문 기록' },
      { path: '/learn/bookmarks', label: '찜한 문제' },
    ],
  },
  { path: '/ai', label: 'AI 분석', icon: 'bi-cpu' },
  {
    path: '/trade',
    label: '모의투자',
    icon: 'bi-graph-up-arrow',
    subItems: [
      { path: '/trade', label: '대시보드' },
      { path: '/trade/stocks', label: '전체 종목' },
      { path: '/trade/history', label: '투자 내역' },
      { path: '/trade/watchlist', label: '관심 종목' },
    ],
  },
  { path: '/mypage', label: '마이페이지', icon: 'bi-person-circle' },
]

const OPTIONAL_NAV: NavItemDef[] = [
  { path: '/news', label: '뉴스', icon: 'bi-newspaper' },
  { path: '/ranking', label: '랭킹', icon: 'bi-trophy' },
  { path: '/community', label: '커뮤니티', icon: 'bi-chat-square-text' },
]

const ADMIN_NAV: NavItemDef[] = [
  { path: '/admin/dashboard', label: '관리자', icon: 'bi-shield-lock' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn, user, logout } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [openSubs, setOpenSubs] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('sidebar-open-subs')
      if (saved) return JSON.parse(saved) as string[]
    } catch {}
    return NAV_ITEMS
      .filter((item) => item.subItems && location.pathname.startsWith(item.path))
      .map((item) => item.path)
  })

  useEffect(() => {
    const autoOpen = NAV_ITEMS
      .filter((item) => item.subItems && location.pathname.startsWith(item.path))
      .map((item) => item.path)
    setOpenSubs((prev) => {
      const next = Array.from(new Set([...prev, ...autoOpen]))
      try { sessionStorage.setItem('sidebar-open-subs', JSON.stringify(next)) } catch {}
      return next
    })
  }, [location.pathname])

  const handle_toggle_sub = (path: string) => {
    setOpenSubs((prev) => {
      const next = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      try { sessionStorage.setItem('sidebar-open-subs', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const isParentActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)

  const handle_logout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div
        className="sidebar-logo"
        onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
        style={{ cursor: 'pointer' }}
        title="홈으로 이동"
      >
        <img className="logo-mark" src="/stockmate-logo.svg" alt="" aria-hidden="true" />
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
                  onClick={() => handle_toggle_sub(item.path)}
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
                      end={sub.path === '/learn' || sub.path === '/trade'}
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

        {isAdmin && (
          <>
            <div className="nav-divider" />
            <div className="nav-section">관리</div>

            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon} nav-icon`} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {isLoggedIn ? (
          <>
            <ProfileAvatar className="avatar-sm" src={user?.profileImageUrl} name={user?.nickname || user?.name} />
            <div style={{ flex: 1 }}>
              <div className="user-name">{user?.name ?? '사용자'}</div>
              <div className="user-level">{user?.level ?? '-'}</div>
            </div>
            <button
              onClick={handle_logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--t3)', fontSize: 18, padding: 4,
                borderRadius: 6, display: 'flex', alignItems: 'center',
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
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--primary)',
              textDecoration: 'none', flex: 1,
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
