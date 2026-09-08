import { api } from './axios'

export type NotificationType =
  | 'QUIZ_GENERATED'
  | 'TRADE_EXECUTED'
  | 'COMMUNITY_COMMENT'
  | 'COMMUNITY_LIKE'

export interface NotificationItem {
  notificationId: number
  userId: number
  type: NotificationType
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface PageMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PagedResult<T> {
  items: T[]
  meta: PageMeta
}

export const api_get_notifications = (params?: { page?: number; limit?: number }) =>
  api.get<PagedResult<NotificationItem>>('/notifications', { params })

export const api_get_unread_count = () =>
  api.get<{ count: number }>('/notifications/unread-count')

export const api_mark_notification_read = (notificationId: number | string) =>
  api.patch<NotificationItem>(`/notifications/${notificationId}/read`)

export const api_mark_all_notifications_read = () =>
  api.patch<{ message: string }>('/notifications/read-all')
