import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface TopbarProps {
  placeholder?: string
  hasNotification?: boolean
  hasWishlist?: boolean
  onSearch?: (query: string) => void
}

export default function Topbar({
  placeholder = '종목, 학습, 뉴스 검색',
  hasNotification = false,
  hasWishlist = false,
  onSearch,
}: TopbarProps) {
  const [query, setQuery] = useState('')
  const { isLoggedIn, user } = useAuth()

  const handle_key_down = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) onSearch(query)
  }

  return (
    <header className="topbar">
      <div className="search-bar">
        <i className="bi bi-search" style={{ color: 'var(--t3)', fontSize: 14, flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handle_key_down}
          placeholder={placeholder}
          aria-label="검색"
        />
      </div>

      <div className="top-actions">
        {isLoggedIn ? (
          <>
            {hasWishlist && (
              <button className="icon-btn" aria-label="찜한 항목">
                <i className="bi bi-heart" />
              </button>
            )}
            <button className="icon-btn" aria-label="알림">
              <i className="bi bi-bell" />
              {hasNotification && <span className="badge" />}
            </button>
            <div className="top-profile">
              <div className="avatar-xs" />
              <span className="profile-name">{user?.name ?? '사용자'}님</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
              <i className="bi bi-box-arrow-in-right" />
              로그인
            </Link>
            <Link to="/signup" className="btn btn-sm" style={{ textDecoration: 'none' }}>
              <i className="bi bi-person-plus" />
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
