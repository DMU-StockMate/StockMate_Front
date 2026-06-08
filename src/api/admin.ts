import axios from 'axios'

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
})

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface AdminUser {
  user_id: number
  email: string
  name: string
  nickname: string
  phone: string
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED'
  ban_until: string | null
  investment_level_id: number | null
  profile_image_url: string | null
  created_at: string
  updated_at: string
}

export interface AdminStock {
  stockId: number
  ticker: string
  companyName: string
  market?: string
  sector?: string
  currency: string
  status: 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
  isActive: boolean
}

// Admin Users
export const api_admin_get_users = () =>
  adminApi.get<AdminUser[]>('/admin/users')

export const api_admin_get_user = (userId: number) =>
  adminApi.get<AdminUser>(`/admin/users/${userId}`)

export const api_admin_update_role = (userId: number, role: 'USER' | 'ADMIN') =>
  adminApi.patch<AdminUser>(`/admin/users/${userId}/role`, { role })

export const api_admin_update_status = (userId: number, status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED') =>
  adminApi.patch<AdminUser>(`/admin/users/${userId}/status`, { status })

// Admin Stocks
export const api_admin_update_stock = (ticker: string, data: { companyName?: string; market?: string; sector?: string }) =>
  adminApi.patch(`/admin/stocks/${ticker}`, data)

export const api_admin_update_stock_status = (ticker: string, status: 'ACTIVE' | 'DELISTED' | 'SUSPENDED') =>
  adminApi.patch(`/admin/stocks/${ticker}/status`, { status })

export const api_admin_delete_stock = (ticker: string) =>
  adminApi.delete(`/admin/stocks/${ticker}`)

// Admin KRX Sync
export const api_admin_sync_stocks = (date?: string) =>
  adminApi.post('/admin/krx/stocks/sync', null, { params: date ? { date } : {} })

export interface SyncPriceParams {
  date?: string
  startDate?: string
  endDate?: string
}

export const api_admin_sync_prices = (params?: string | SyncPriceParams) => {
  const queryParams = typeof params === 'string' ? { date: params } : params ?? {}
  return adminApi.post('/admin/krx/prices/sync', null, {
    params: queryParams,
    timeout: 15 * 60 * 1000,
  })
}
