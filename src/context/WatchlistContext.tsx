import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  api_create_watchlist,
  api_delete_watchlist,
  api_get_watchlist,
  type WatchlistStock,
} from '../api/watchlist'
import { api_get_stock_latest_price, type Stock, type StockPriceDaily } from '../api/stocks'
import { useAuth } from './AuthContext'
import { get_price, get_rate, parse_num, unwrap_price } from '../hooks/useTradeStocks'

export interface WatchlistRow {
  watchlistId: string
  ticker: string
  companyName: string
  market?: string
  sector?: string
  currency: string
  status: 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
  createdAt?: string
  currentPrice: number
  changeRate?: number
}

interface WatchlistContextType {
  actionTicker: string | null
  error: string | null
  isInWatchlist: (ticker: string) => boolean
  items: WatchlistRow[]
  loading: boolean
  reload: () => Promise<void>
  remove: (watchlistId: string) => Promise<void>
  toggleStock: (stock: WatchlistStock | Stock) => Promise<void>
  totalValue: number
}

type ApiObject = Record<string, unknown>

const WatchlistContext = createContext<WatchlistContextType | null>(null)

const as_object = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {}

const get_array = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data
  const obj = as_object(data)
  const candidates = [obj.items, obj.data, obj.list, obj.content, obj.results]
  return candidates.find(Array.isArray) as unknown[] ?? []
}

const pick_text = (obj: ApiObject, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

const normalize_watchlist_item = (value: unknown): WatchlistRow | null => {
  const obj = as_object(value)
  const stock = as_object(obj.stock ?? obj.stockInfo ?? obj.stockDetail)
  const source = { ...obj, ...stock }
  const ticker = pick_text(source, ['ticker', 'stockCode', 'stock_code', 'code', 'symbol', 'shortCode'])
  if (!ticker) return null

  const watchlistId = pick_text(obj, ['watchlistId', 'id', 'watchlist_id'], ticker)
  const companyName = pick_text(source, ['companyName', 'stockName', 'stock_name', 'name', 'company_name'], ticker)
  const isActive = source.isActive !== false && source.active !== false
  const rawStatus = pick_text(source, ['status'], isActive ? 'ACTIVE' : 'SUSPENDED')
  const status = ['ACTIVE', 'DELISTED', 'SUSPENDED'].includes(rawStatus)
    ? rawStatus as WatchlistRow['status']
    : 'ACTIVE'
  const priceObj = as_object(obj.price ?? obj.latestPrice ?? obj.summary ?? stock.price ?? stock.latestPrice)
  const currentPrice = get_price(priceObj as unknown as StockPriceDaily) || parse_num(source.currentPrice ?? source.closePrice ?? source.price) || 0
  const changeRate = get_rate(priceObj as unknown as StockPriceDaily) ?? parse_num(source.changeRate ?? source.rate)

  return {
    watchlistId,
    ticker,
    companyName,
    market: pick_text(source, ['market', 'marketName', 'market_name']) || undefined,
    sector: pick_text(source, ['sectorName', 'sector_name', 'sector']) || undefined,
    currency: pick_text(source, ['currency'], 'KRW'),
    status,
    createdAt: pick_text(obj, ['createdAt', 'created_at', 'registeredAt']) || undefined,
    currentPrice,
    changeRate,
  }
}

const get_error_message = (error: unknown, fallback: string) => {
  const obj = as_object(error)
  const response = as_object(obj.response)
  const data = as_object(response.data)
  const message = data.message
  if (Array.isArray(message)) return message.join('\n')
  if (typeof message === 'string') return message
  if (typeof obj.message === 'string') return obj.message
  return fallback
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth()
  const [items, setItems] = useState<WatchlistRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionTicker, setActionTicker] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isLoggedIn) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data } = await api_get_watchlist()
      const rows = get_array(data)
        .map(normalize_watchlist_item)
        .filter((row): row is WatchlistRow => row !== null)

      const pricedRows = await Promise.all(rows.map(async (row) => {
        try {
          const { data: priceData } = await api_get_stock_latest_price(row.ticker)
          const price = unwrap_price(priceData) as unknown as StockPriceDaily
          return {
            ...row,
            currentPrice: get_price(price) || row.currentPrice,
            changeRate: get_rate(price) ?? row.changeRate,
          }
        } catch {
          return row
        }
      }))

      setItems(pricedRows)
    } catch (err) {
      setError(get_error_message(err, '관심 종목을 불러오지 못했습니다.'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoading) void reload()
  }, [isLoading, reload])

  const byTicker = useMemo(() => {
    const map: Record<string, WatchlistRow> = {}
    items.forEach((item) => { map[item.ticker] = item })
    return map
  }, [items])

  const isInWatchlist = useCallback((ticker: string) => Boolean(byTicker[ticker]), [byTicker])

  const remove = useCallback(async (watchlistId: string) => {
    const target = items.find((item) => item.watchlistId === watchlistId)
    setActionTicker(target?.ticker ?? watchlistId)
    setError(null)
    try {
      await api_delete_watchlist(watchlistId)
      setItems((prev) => prev.filter((item) => item.watchlistId !== watchlistId))
    } catch (err) {
      setError(get_error_message(err, '관심 종목 삭제에 실패했습니다.'))
      throw err
    } finally {
      setActionTicker(null)
    }
  }, [items])

  const toggleStock = useCallback(async (stock: WatchlistStock | Stock) => {
    const ticker = stock.ticker
    if (!ticker) return

    const existing = byTicker[ticker]
    setActionTicker(ticker)
    setError(null)
    try {
      if (existing) {
        await api_delete_watchlist(existing.watchlistId)
        setItems((prev) => prev.filter((item) => item.ticker !== ticker))
        return
      }

      await api_create_watchlist({ stockCode: ticker })
      await reload()
    } catch (err) {
      setError(get_error_message(err, existing ? '관심 종목 삭제에 실패했습니다.' : '관심 종목 등록에 실패했습니다.'))
      throw err
    } finally {
      setActionTicker(null)
    }
  }, [byTicker, reload])

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.currentPrice, 0),
    [items],
  )

  return (
    <WatchlistContext.Provider value={{
      actionTicker,
      error,
      isInWatchlist,
      items,
      loading,
      reload,
      remove,
      toggleStock,
      totalValue,
    }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlistContext() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider')
  return ctx
}
