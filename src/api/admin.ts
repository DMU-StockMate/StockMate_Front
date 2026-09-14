import axios from 'axios'
import { API_BASE_URL } from './axios'

const adminApi = axios.create({
  baseURL: API_BASE_URL,
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

export type AdminQuestionReviewStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'REVIEW_REQUIRED'

export interface AdminQuestionCandidate {
  questionId: number
  questionText: string
  category: { categoryId: number; categoryName: string } | null
  detail: { detailId: number; detailName: string } | null
  sourceType: string
  quizPoolType: string
  visibility: string
  source: string
  reviewStatus: AdminQuestionReviewStatus
  aiQualityScore: number | null
  finalQualityScore: number | null
  similarityScore: number | null
  similarQuestionId: number | null
  reason: string
  warning?: string | null
}

export interface AdminQuestionCandidatesResponse {
  items: AdminQuestionCandidate[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminQuestionQualitySummary {
  totalQuestions: number
  targetActiveCount: number
  reviewStatusCounts: Record<AdminQuestionReviewStatus, number>
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

// Admin Learning
export const api_admin_get_question_quality_summary = () =>
  adminApi.get<AdminQuestionQualitySummary>('/admin/learning/questions/quality-summary')

export const api_admin_get_question_candidates = (params?: {
  reviewStatus?: AdminQuestionReviewStatus
  page?: number
  limit?: number
}) =>
  adminApi.get<AdminQuestionCandidatesResponse>('/admin/learning/questions/quality-candidates', { params })

export const api_admin_update_question_review_status = (questionId: number, reviewStatus: AdminQuestionReviewStatus) =>
  adminApi.patch<AdminQuestionCandidate>(`/admin/learning/questions/${questionId}/review-status`, { reviewStatus })

export const api_admin_recalculate_question_quality = (questionId: number) =>
  adminApi.patch<AdminQuestionCandidate>(`/admin/learning/questions/${questionId}/recalculate-quality`)

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
