import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGlobalSearch } from '../../hooks/useGlobalSearch'
import { useNotifications } from '../../hooks/useNotifications'
import GlobalSearchDropdown from './GlobalSearchDropdown'
import NotificationDropdown from './NotificationDropdown'

interface TopbarProps {
  placeholder?: string
  hasWishlist?: boolean
}

export default function Topbar({
  placeholder = '종목, 커뮤니티, 학습 검색',
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
  const {
    open: notifOpen,
    loading: notifLoading,
    items: notifItems,
    unreadCount,
    handle_toggle: handle_notif_toggle,
    handle_close: handle_notif_close,
    handle_select: handle_notif_select,
    handle_mark_all_read,
  } = useNotifications()

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
            <div className="notification-anchor" onBlur={handle_notif_close}>
              <button
                type="button"
                className="icon-btn"
                aria-label="알림"
                onClick={handle_notif_toggle}
              >
                <i className="bi bi-bell" />
                {unreadCount > 0 && <span className="badge" />}
              </button>
              {notifOpen && (
                <NotificationDropdown
                  loading={notifLoading}
                  items={notifItems}
                  onSelect={handle_notif_select}
                  onMarkAllRead={handle_mark_all_read}
                />
              )}
            </div>
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
