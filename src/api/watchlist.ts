import { api } from './axios'
import type { Stock } from './stocks'

export interface WatchlistStock extends Partial<Stock> {
  ticker: string
  companyName: string
  market?: string
  sector?: string
  currency?: string
  status?: 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
  [key: string]: unknown
}

export interface WatchlistItem {
  watchlistId: string
  stockCode: string
  stock?: WatchlistStock
  companyName?: string
  market?: string
  sector?: string
  createdAt?: string
  [key: string]: unknown
}

export interface CreateWatchlistRequest {
  stockCode: string
}

export interface WatchlistCheckResponse {
  isWatchlisted?: boolean
  isInWatchlist?: boolean
  watchlisted?: boolean
  exists?: boolean
  watchlistId?: string
  [key: string]: unknown
}

export const api_create_watchlist = (data: CreateWatchlistRequest) =>
  api.post<WatchlistItem>('/watchlist', data)

export const api_get_watchlist = () =>
  api.get<WatchlistItem[] | { items?: WatchlistItem[]; data?: WatchlistItem[]; list?: WatchlistItem[] }>('/watchlist')

export const api_get_watchlist_item = (watchlistId: string) =>
  api.get<WatchlistItem>(`/watchlist/${watchlistId}`)

export const api_check_watchlist = (stockCode: string) =>
  api.get<WatchlistCheckResponse>(`/watchlist/check/${stockCode}`)

export const api_delete_watchlist = (watchlistId: string) =>
  api.delete(`/watchlist/${watchlistId}`)
