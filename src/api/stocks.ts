import { api } from './axios'

export interface Stock {
  stockId: number
  ticker: string
  companyName: string
  market?: string
  sector?: string
  currency: string
  status: 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
  isActive: boolean
  [key: string]: unknown
}

export interface StockRankingItem extends Partial<Stock> {
  code?: string
  symbol?: string
  name?: string
  price?: number
  currentPrice?: number
  closePrice?: number
  change?: number
  changePrice?: number
  changeRate?: number
  rate?: number
  volume?: number
}

export interface StockDetail extends Stock {
  detail?: {
    eps?: number
    per?: number
    pbr?: number
    roe?: number
    marketCap?: number
    description?: string
  }
}

export interface StockPriceDaily {
  priceId: number
  ticker: string
  tradeDate: string
  openPrice: number
  highPrice: number
  lowPrice: number
  closePrice: number
  volume: number
  changeRate?: number
}

export interface StockSummary {
  ticker: string
  companyName?: string
  currentPrice?: number
  closePrice?: number
  changeRate?: number
  marketCap?: number
  volume?: number
  [key: string]: unknown
}

export interface StockListResponse {
  items: Stock[]
  total: number
  page: number
  limit: number
}

export interface StockSearchParams {
  keyword?: string
  query?: string
  q?: string
  market?: 'KOSPI' | 'KOSDAQ' | 'KONEX'
  status?: 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
  page?: number
  limit?: number
}

export interface StockPriceParams {
  startDate?: string
  endDate?: string
  limit?: number
  days?: number
  period?: string
}

export interface StockChartResponse {
  stockId: number
  ticker: string
  companyName: string
  interval: 'daily' | 'weekly' | 'monthly'
  prices: StockPriceDaily[]
}

export const api_get_stocks_all = (params?: Omit<StockSearchParams, 'keyword' | 'query'>) =>
  api.get<StockListResponse | Stock[]>('/stocks/all', { params })

export const api_search_stocks = (params?: StockSearchParams) =>
  api.get<StockListResponse | Stock[]>('/stocks/search', { params })

export const api_get_stocks = (params?: StockSearchParams) => {
  const keyword = params?.keyword?.trim() || params?.query?.trim()
  if (keyword) {
    return api_search_stocks({ ...params, keyword, query: keyword, q: keyword })
  }
  return api_get_stocks_all(params)
}

export const api_get_stock = (ticker: string) =>
  api.get<StockDetail>(`/stocks/${ticker}`)

export const api_get_stock_prices = (ticker: string, params?: StockPriceParams) =>
  api.get<StockChartResponse>(`/stocks/${ticker}/ohlcv`, { params })

export const api_get_stock_latest_price = (ticker: string) =>
  api.get<StockPriceDaily>(`/stocks/${ticker}/price`)

export const api_get_stock_summary = (ticker: string) =>
  api.get<StockSummary>(`/stocks/${ticker}/summary`)

export const api_get_stock_chart = (ticker: string, params?: StockPriceParams) =>
  api.get<StockChartResponse>(`/stocks/${ticker}/chart`, { params })

export const api_get_stock_chart_daily = (ticker: string, params?: StockPriceParams) =>
  api.get<StockChartResponse>(`/stocks/${ticker}/chart/daily`, { params })

export const api_get_stock_chart_weekly = (ticker: string, params?: StockPriceParams) =>
  api.get<StockChartResponse>(`/stocks/${ticker}/chart/weekly`, { params })

export const api_get_stock_chart_monthly = (ticker: string, params?: StockPriceParams) =>
  api.get<StockChartResponse>(`/stocks/${ticker}/chart/monthly`, { params })

export const api_get_stock_financials = (ticker: string) =>
  api.get(`/stocks/${ticker}/financials`)

export const api_get_stock_indicators = (ticker: string) =>
  api.get(`/stocks/${ticker}/indicators`)

export const api_get_stock_dividends = (ticker: string) =>
  api.get(`/stocks/${ticker}/dividends`)

export const api_get_stock_markets = () =>
  api.get<string[]>('/stocks/markets')

export const api_get_stock_rankings_rise = () =>
  api.get<StockRankingItem[]>('/stocks/rankings/rise')

export const api_get_stock_rankings_fall = () =>
  api.get<StockRankingItem[]>('/stocks/rankings/fall')

export const api_get_stock_rankings_volume = () =>
  api.get<StockRankingItem[]>('/stocks/rankings/volume')

export const api_get_stock_sectors = () =>
  api.get('/stocks/sectors')

export const api_get_stock_sector = (sectorId: number | string) =>
  api.get(`/stocks/sectors/${sectorId}`)
