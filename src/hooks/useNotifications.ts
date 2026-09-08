import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import {
  api_get_notifications,
  api_get_unread_count,
  api_mark_all_notifications_read,
  api_mark_notification_read,
  type NotificationItem,
} from '../api/notification'

const POLL_MS = 30000

export function useNotifications() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh_unread_count = useCallback(() => {
    if (!isLoggedIn) return
    api_get_unread_count()
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => {})
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0)
      setItems([])
      return
    }
    refresh_unread_count()
    const timer = setInterval(refresh_unread_count, POLL_MS)
    return () => clearInterval(timer)
  }, [isLoggedIn, refresh_unread_count])

  const handle_toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        setLoading(true)
        api_get_notifications({ limit: 20 })
          .then(({ data }) => setItems(data.items))
          .catch(() => setItems([]))
          .finally(() => setLoading(false))
      }
      return next
    })
  }, [])

  const handle_close = useCallback(() => setOpen(false), [])

  const handle_select = useCallback((notification: NotificationItem) => {
    setOpen(false)
    if (!notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setItems((prev) => prev.map((item) =>
        item.notificationId === notification.notificationId ? { ...item, isRead: true } : item,
      ))
      void api_mark_notification_read(notification.notificationId).catch(() => {})
    }
    if (notification.link) navigate(notification.link)
  }, [navigate])

  const handle_mark_all_read = useCallback(() => {
    setUnreadCount(0)
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
    void api_mark_all_notifications_read().catch(() => {})
  }, [])

  return {
    open,
    loading,
    items,
    unreadCount,
    handle_toggle,
    handle_close,
    handle_select,
    handle_mark_all_read,
  }
}
