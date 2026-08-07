import { api } from './axios'

export interface NewsSummary {
  title: string
  summary: string
  source: string
  url: string
  publishedAt: string | null
}

export const api_get_news_summaries = (params?: { keyword?: string; limit?: number }) =>
  api.get<NewsSummary[]>('/news/summaries', { params })
