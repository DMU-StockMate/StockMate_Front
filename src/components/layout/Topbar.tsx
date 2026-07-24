import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGlobalSearch } from '../../hooks/useGlobalSearch'
import GlobalSearchDropdown from './GlobalSearchDropdown'

interface TopbarProps {
  placeholder?: string
  hasNotification?: boolean
  hasWishlist?: boolean
}

export default function Topbar({
  placeholder = '종목, 커뮤니티, 학습 검색',
  hasNotification = false,
  hasWishlist = false,
}: TopbarProps) {
  const { isLoggedIn, user } = useAuth()
  const {
    query, setQuery,
    setFocused,
    open,
    loading,
    stockResults, communityResults, learningResults,
    handle_select, handle_key_down,
  } = useGlobalSearch()

  return (
    <header className="topbar">
      <div className="search-bar">
        <i className="bi bi-search" style={{ color: 'var(--t3)', fontSize: 14, flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handle_key_down}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-label="검색"
        />
        {open && (
          <GlobalSearchDropdown
            query={query}
            loading={loading}
            stockResults={stockResults}
            communityResults={communityResults}
            learningResults={learningResults}
            onSelect={handle_select}
          />
        )}
      </div>

      <div className="top-actions">
        {isLoggedIn ? (
          <>
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
