import type { NotificationItem, NotificationType } from '../../api/notification'
import { format_community_date } from '../../utils/community'

const TYPE_ICON: Record<NotificationType, string> = {
  QUIZ_GENERATED: 'bi-journal-check',
  TRADE_EXECUTED: 'bi-graph-up-arrow',
  COMMUNITY_COMMENT: 'bi-chat-square-text',
  COMMUNITY_LIKE: 'bi-heart-fill',
}

interface NotificationDropdownProps {
  loading: boolean
  items: NotificationItem[]
  onSelect: (item: NotificationItem) => void
  onMarkAllRead: () => void
}

export default function NotificationDropdown({
  loading,
  items,
  onSelect,
  onMarkAllRead,
}: NotificationDropdownProps) {
  return (
    <div className="search-dropdown notification-dropdown" onMouseDown={(event) => event.preventDefault()}>
      <div className="notification-dropdown-header">
        <span className="search-dropdown-label" style={{ padding: 0 }}>알림</span>
        <button type="button" className="notification-mark-all" onClick={onMarkAllRead}>
          모두 읽음
        </button>
      </div>
      {loading && <div className="search-dropdown-loading">불러오는 중...</div>}
      {!loading && items.length === 0 && (
        <div className="search-dropdown-empty">새로운 알림이 없습니다.</div>
      )}
      {!loading && items.map((item) => (
        <div
          key={item.notificationId}
          className="search-dropdown-item"
          onClick={() => onSelect(item)}
        >
          <i className={`bi ${TYPE_ICON[item.type]}`} />
          <div style={{ flex: 1 }}>
            <div className="search-dropdown-title">
              {item.title}
              {!item.isRead && <span className="notification-unread-dot" />}
            </div>
            <div className="search-dropdown-subtitle">{item.message}</div>
            <div className="search-dropdown-subtitle">{format_community_date(item.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
