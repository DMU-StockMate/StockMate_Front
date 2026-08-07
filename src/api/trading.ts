import { api } from './axios'

export type TradeType = 'BUY' | 'SELL'

export interface TradingAccount {
  accountId: number
  userId: number
  seedMoney: string
  cashBalance: string
  totalAssetValue: string
}

export interface Holding {
  holdingId: string
  stockId: number
  ticker: string
  companyName: string
  quantity: number
  averagePrice: string
}

export interface Trade {
  tradeId: string
  accountId: number
  tradeType: TradeType
  ticker: string
  companyName: string
  quantity: number
  price: string
  totalAmount: string
  realizedProfit?: string | null
  createdAt: string
}

export interface TradeListResponse {
  items: Trade[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateTradeRequest {
  ticker: string
  quantity: number
  price?: number
}

export interface TradeResult {
  trade: Trade
  account: {
    cashBalance: string
    totalAssetValue: string
  }
  holding: {
    ticker: string
    companyName: string
    quantity: number
    averagePrice: string
  } | null
}

export interface RankingUser {
  rank: number
  userId: number
  nickname: string
  profileImageUrl?: string | null
  totalAssetValue: string
  cashBalance?: string
  seedMoney: string
  growthAmount?: string
  growthRate?: string
}

export const api_get_trading_account = () =>
  api.get<TradingAccount>('/trading/account')

export const api_get_holdings = () =>
  api.get<Holding[]>('/trading/holdings')

export const api_get_trades = (params?: { page?: number; limit?: number }) =>
  api.get<TradeListResponse>('/trading/trades', { params })

export const api_buy_stock = (data: CreateTradeRequest) =>
  api.post<TradeResult>('/trading/buy', data)

export const api_sell_stock = (data: CreateTradeRequest) =>
  api.post<TradeResult>('/trading/sell', data)

export const api_get_asset_rankings = (params?: { limit?: number }) =>
  api.get<RankingUser[]>('/trading/rankings/assets', { params })

export const api_get_weekly_growth_rankings = (params?: { limit?: number }) =>
  api.get<RankingUser[]>('/trading/rankings/weekly-growth', { params })
