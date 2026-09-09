import { api } from './axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const get_stock_price_stream_url = (ticker: string) =>
  `${API_BASE_URL}/stocks/${ticker}/price/stream`

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
  price?: number | string
  currentPrice?: number | string
  closePrice?: number | string
  change?: number | string
  changePrice?: number | string
  changeRate?: number | string
  rate?: number | string
  volume?: number | string
  tradeDate?: string
  previousClosePrice?: number | string
  openPrice?: number | string
  highPrice?: number | string
  lowPrice?: number | string
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

export interface StockInvestmentIndicators {
  stockId: number
  ticker: string
  companyName: string
  tradeDate?: string | null
  currentPrice?: number | string | null
  previousClosePrice?: number | string | null
  changePrice?: number | string | null
  changeRate?: number | string | null
  marketCap?: number | string | null
  totalShares?: number | string | null
  estimatedMarketCap?: number | string | null
  indicators?: {
    per?: number | string | null
    pbr?: number | string | null
    eps?: number | string | null
    bps?: number | string | null
    roe?: number | string | null
    dividendYield?: number | string | null
    dps?: number | string | null
  }
  indicatorTradeDate?: string | null
  indicatorSource?: string | null
  dataAvailability?: {
    marketCap?: boolean
    totalShares?: boolean
    financialIndicators?: boolean
  }
}

export interface InvestorTrendDay {
  date: string
  individualNet: number
  foreignNet: number
  institutionNet: number
  institutionDetail: {
    financialInvestment: number
    insurance: number
    investmentTrust: number
    otherFinance: number
    bank: number
    pensionFund: number
    privateFund: number
    nation: number
    otherCorp: number
  }
}

export interface InvestorTrendResponse {
  ticker: string
  days: InvestorTrendDay[]
}

export const api_get_stocks_all = (params?: Omit<StockSearchParams, 'keyword' | 'query'>) =>
  api.get<StockListResponse | Stock[]>('/stocks/all', { params })

export const api_search_stocks = (params?: StockSearchParams) =>
  api.get<StockListResponse | Stock[]>('/stocks/search', { params })

export const api_get_stocks = (params?: StockSearchParams) => {
  const keyword = params?.keyword?.trim() || params?.query?.trim()
  if (keyword) {
    const { query: _query, q: _q, ...rest } = params ?? {}
    void _query
    void _q
    return api_search_stocks({ ...rest, keyword })
  }
  return api_get_stocks_all(params)
}

export const api_get_stock = (ticker: string) =>
  api.get<StockDetail>(`/stocks/${ticker}`)

export const api_get_stock_prices = (ticker: string, params?: StockPriceParams) =>
  api.get<StockChartResponse>(`/stocks/${ticker}/ohlcv`, { params })

export const api_get_stock_latest_price = (ticker: string) =>
  api.get<StockPriceDaily>(`/stocks/${ticker}/price`)

export const api_subscribe_stock_realtime = (stockCodes: string[]) =>
  api.post('/stocks/realtime/subscribe', { stockCodes })

export const api_get_stock_realtime_price = (ticker: string) =>
  api.get<StockPriceDaily>(`/stocks/${ticker}/realtime/price`)

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
  api.get<StockInvestmentIndicators>(`/stocks/${ticker}/indicators`)

export const api_get_stock_investor_trend = (ticker: string) =>
  api.get<InvestorTrendResponse>(`/stocks/${ticker}/investor-trend`)

export interface RevenueCompositionItem {
  name: string
  ratio: number
}

export interface RevenueCompositionResponse {
  ticker: string
  period: string | null
  items: RevenueCompositionItem[]
}

export const api_get_stock_revenue_composition = (ticker: string) =>
  api.get<RevenueCompositionResponse>(`/stocks/${ticker}/revenue-composition`)

export const api_get_stock_dividends = (ticker: string) =>
  api.get(`/stocks/${ticker}/dividends`)

export const api_get_stock_markets = () =>
  api.get<string[]>('/stocks/markets')

export const api_get_stock_rankings_rise = (params?: { limit?: number | string }) =>
  api.get<StockRankingItem[]>('/stocks/rankings/rise', { params })

export const api_get_stock_rankings_fall = (params?: { limit?: number | string }) =>
  api.get<StockRankingItem[]>('/stocks/rankings/fall', { params })

export const api_get_stock_rankings_volume = (params?: { limit?: number | string }) =>
  api.get<StockRankingItem[]>('/stocks/rankings/volume', { params })

export const api_get_stock_sectors = () =>
  api.get('/stocks/sectors')

export const api_get_stock_sector = (sectorId: number | string) =>
  api.get(`/stocks/sectors/${sectorId}`)
