import { useCallback, useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  api_get_stock_latest_price,
  api_get_stock_rankings_fall,
  api_get_stock_rankings_rise,
  api_get_stock_rankings_volume,
  api_get_stocks,
  type Stock,
  type StockPriceDaily,
  type StockRankingItem,
} from '../api/stocks'
import {
  api_buy_stock,
  api_get_holdings,
  api_get_trades,
  api_get_trading_account,
  api_sell_stock,
  type Holding,
  type Trade,
  type TradingAccount,
} from '../api/trading'

export type MarketFilter = '전체' | 'KOSPI' | 'KOSDAQ' | 'KONEX'
export type StockViewFilter = 'all' | 'rise' | 'fall' | 'volume'
export type TradeMode = 'buy' | 'sell'
export type DisplayStock = Stock & {
  ticker: string
  companyName: string
  market?: string
  sector?: string
  currency: string
  status: 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
}

export interface TradeModalState {
  open: boolean
  mode: TradeMode
  stock?: DisplayStock
}

type ApiObject = Record<string, unknown>

const as_object = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {}

const get_array = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data
  const obj = as_object(data)
  const candidates = [obj.items, obj.data, obj.stocks, obj.content, obj.results, obj.list]
  return candidates.find(Array.isArray) as unknown[] ?? []
}

const get_text = (obj: ApiObject, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

export const parse_num = (value: unknown) => {
  if (typeof value === 'string') {
    const normalized = value.replaceAll(',', '').replace('%', '').trim()
    const n = Number(normalized)
    return Number.isNaN(n) ? undefined : n
  }
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

const get_num = (obj: ApiObject, keys: string[]) => {
  for (const key of keys) {
    const n = parse_num(obj[key])
    if (n !== undefined) return n
  }
  return 0
}

const normalize_stock = (value: unknown): DisplayStock => {
  const obj = as_object(value)
  const sectorObj = as_object(obj.sector)
  const ticker = get_text(obj, ['ticker', 'stockCode', 'stock_code', 'code', 'symbol', 'shortCode'])
  const companyName = get_text(obj, ['companyName', 'stockName', 'stock_name', 'name', 'company_name'], ticker)
  const isActive = obj.isActive !== false && obj.active !== false
  const status = get_text(obj, ['status'], isActive ? 'ACTIVE' : 'SUSPENDED') as DisplayStock['status']
  return {
    ...(obj as Stock),
    stockId: Number(obj.stockId ?? obj.id ?? 0),
    ticker,
    companyName,
    market: get_text(obj, ['market', 'marketName', 'market_name']) || undefined,
    sector: get_text(obj, ['sectorName', 'sector_name', 'sector'], get_text(sectorObj, ['name', 'sectorName'])) || undefined,
    currency: get_text(obj, ['currency'], 'KRW'),
    status: ['ACTIVE', 'DELISTED', 'SUSPENDED'].includes(status) ? status : 'ACTIVE',
    isActive,
  }
}

const get_stock_list = (data: unknown) =>
  get_array(data).map(normalize_stock).filter((stock) => stock.ticker)

const get_ranking_list = (data: unknown) =>
  get_array(data).map(normalize_stock).filter((stock) => stock.ticker)

export const unwrap_price = (data: unknown) => {
  const obj = as_object(data)
  const payload = as_object(obj.data ?? data)
  const nestedPrice = as_object(payload.price ?? payload.latestPrice ?? payload.latest)
  return { ...nestedPrice, ...payload }
}

const has_num = (obj: ApiObject, keys: string[]) =>
  keys.some((key) => parse_num(obj[key]) !== undefined)

const get_optional_num = (obj: ApiObject, keys: string[]) => {
  for (const key of keys) {
    const n = parse_num(obj[key])
    if (n !== undefined) return n
  }
  return undefined
}

export const get_price = (data?: StockPriceDaily) =>
  data ? get_num(unwrap_price(data), ['currentPrice', 'closePrice', 'price', 'close', 'tradePrice']) : 0

export const get_rate = (data?: StockPriceDaily) =>
  data ? (() => {
    const price = unwrap_price(data)
    const keys = [
      'changeRate',
      'change_rate',
      'rate',
      'changePercent',
      'change_percent',
      'fluctuationRate',
      'fluctuation_rate',
      'signedChangeRate',
      'signed_change_rate',
    ]
    return has_num(price, keys) ? get_optional_num(price, keys) : undefined
  })() : undefined

export const get_volume = (data?: StockPriceDaily | DisplayStock | StockRankingItem) =>
  data ? get_num(unwrap_price(data), ['volume', 'accTradeVolume', 'tradingVolume']) : 0

export const fmt_price = (v?: number) => (v && v > 0 ? `${v.toLocaleString()}원` : '-')
export const fmt_money = (v?: number | string) => {
  const n = parse_num(v)
  return n !== undefined ? `${Math.round(n).toLocaleString()}원` : '-'
}
export const fmt_rate = (v?: number) => {
  if (v === undefined || v === null) return '-'
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
}
export const fmt_volume = (v?: number) => (v && v > 0 ? v.toLocaleString() : '-')

const get_error_message = (error: unknown) => {
  const obj = as_object(error)
  const response = as_object(obj.response)
  const data = as_object(response.data)
  const message = data.message
  if (Array.isArray(message)) return message.join('\n')
  if (typeof message === 'string') return message
  if (typeof obj.message === 'string') return obj.message
  return '주문 처리 중 오류가 발생했습니다.'
}

const matches_keyword = (stock: DisplayStock, keyword: string) => {
  const q = keyword.trim().toLowerCase()
  if (!q) return true
  return [stock.ticker, stock.companyName, stock.market, stock.sector]
    .some((value) => value?.toLowerCase().includes(q))
}

export function useTradeStocks() {
  const [allStocks, setAllStocks] = useState<DisplayStock[]>([])
  const [prices, setPrices] = useState<Record<string, StockPriceDaily>>({})
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [market, setMarket] = useState<MarketFilter>('전체')
  const [viewFilter, setViewFilter] = useState<StockViewFilter>('all')
  const [account, setAccount] = useState<TradingAccount | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [tradeModal, setTradeModal] = useState<TradeModalState>({ open: false, mode: 'buy' })
  const [tradeQty, setTradeQty] = useState(1)
  const [tradeLoading, setTradeLoading] = useState(false)
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const LIMIT = 20

  const loadTradingSnapshot = useCallback(() => {
    Promise.allSettled([
      api_get_trading_account(),
      api_get_holdings(),
      api_get_trades({ page: 1, limit: 3 }),
    ]).then(([accountRes, holdingsRes, tradesRes]) => {
      if (accountRes.status === 'fulfilled') setAccount(accountRes.value.data)
      if (holdingsRes.status === 'fulfilled') setHoldings(holdingsRes.value.data)
      if (tradesRes.status === 'fulfilled') setRecentTrades(tradesRes.value.data.items ?? [])
    })
  }, [])

  const loadStocks = useCallback(() => {
    setLoading(true)
    if (viewFilter !== 'all') {
      const rankingApi = viewFilter === 'rise'
        ? api_get_stock_rankings_rise
        : viewFilter === 'fall'
          ? api_get_stock_rankings_fall
          : api_get_stock_rankings_volume

      rankingApi({ limit: 100 })
        .then(({ data }) => {
          const list = get_ranking_list(data)
            .filter((stock) => market === '전체' || stock.market === market)
            .filter((stock) => matches_keyword(stock, keyword))
          setAllStocks(list)
          setPage(1)
        })
        .catch(() => setAllStocks([]))
        .finally(() => setLoading(false))
      return
    }

    api_get_stocks({
      keyword: keyword || undefined,
      market: market !== '전체' ? market : undefined,
      status: 'ACTIVE',
    })
      .then(({ data }) => {
        const list = get_stock_list(data)
        if (keyword.trim() && list.length === 0) {
          return api_get_stocks({
            market: market !== '전체' ? market : undefined,
            status: 'ACTIVE',
          }).then(({ data }) => {
            setAllStocks(get_stock_list(data).filter((stock) => matches_keyword(stock, keyword)))
            setPage(1)
          })
        }
        setAllStocks(list)
        setPage(1)
      })
      .catch(() => {
        if (!keyword.trim()) {
          setAllStocks([])
          return
        }
        return api_get_stocks({
          market: market !== '전체' ? market : undefined,
          status: 'ACTIVE',
        })
          .then(({ data }) => setAllStocks(get_stock_list(data).filter((stock) => matches_keyword(stock, keyword))))
          .catch(() => setAllStocks([]))
      })
      .finally(() => setLoading(false))
  }, [keyword, market, viewFilter])

  useEffect(() => { loadStocks() }, [loadStocks])
  useEffect(() => { loadTradingSnapshot() }, [loadTradingSnapshot])

  const handleSearch = useCallback(() => {
    setKeyword(searchInput)
  }, [searchInput])

  const handleClear = useCallback(() => {
    setSearchInput('')
    setKeyword('')
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }, [handleSearch])

  const total = allStocks.length
  const totalPages = Math.ceil(total / LIMIT)
  const stocks = useMemo(
    () => allStocks.slice((page - 1) * LIMIT, page * LIMIT),
    [allStocks, page],
  )
  const holdingsByTicker = useMemo(() => {
    const map: Record<string, Holding> = {}
    holdings.forEach((holding) => { map[holding.ticker] = holding })
    return map
  }, [holdings])

  const openTradeModal = useCallback((mode: TradeMode, stock?: DisplayStock) => {
    const selected = stock ?? stocks.find((s) => s.status === 'ACTIVE') ?? allStocks.find((s) => s.status === 'ACTIVE')
    if (!selected) return
    setTradeModal({ open: true, mode, stock: selected })
    setTradeQty(1)
    setTradeMessage(null)
  }, [allStocks, stocks])

  const closeTradeModal = useCallback(() => {
    if (tradeLoading) return
    setTradeModal({ open: false, mode: 'buy' })
    setTradeQty(1)
  }, [tradeLoading])

  const selectedPrice = tradeModal.stock ? get_price(prices[tradeModal.stock.ticker]) : 0
  const selectedHolding = tradeModal.stock ? holdingsByTicker[tradeModal.stock.ticker] : undefined
  const cashBalance = parse_num(account?.cashBalance) ?? 0
  const orderAmount = selectedPrice * tradeQty
  const expectedCash = tradeModal.mode === 'buy' ? cashBalance - orderAmount : cashBalance + orderAmount
  const canSubmitTrade = Boolean(tradeModal.stock)
    && tradeQty > 0
    && !tradeLoading
    && tradeModal.stock?.status === 'ACTIVE'
    && (tradeModal.mode === 'buy'
      ? selectedPrice <= 0 || cashBalance >= orderAmount
      : (selectedHolding?.quantity ?? 0) >= tradeQty)

  const submitTrade = useCallback(async () => {
    if (!tradeModal.stock || !canSubmitTrade) return
    setTradeLoading(true)
    setTradeMessage(null)

    const payload = {
      ticker: tradeModal.stock.ticker,
      quantity: tradeQty,
      ...(selectedPrice > 0 ? { price: selectedPrice } : {}),
    }

    try {
      const { data } = tradeModal.mode === 'buy'
        ? await api_buy_stock(payload)
        : await api_sell_stock(payload)

      setTradeMessage({
        type: 'success',
        text: `${data.trade.companyName} ${data.trade.quantity}주 ${tradeModal.mode === 'buy' ? '매수' : '매도'} 체결`,
      })
      setTradeModal({ open: false, mode: 'buy' })
      setTradeQty(1)
      loadTradingSnapshot()
    } catch (error) {
      setTradeMessage({ type: 'error', text: get_error_message(error) })
    } finally {
      setTradeLoading(false)
    }
  }, [canSubmitTrade, loadTradingSnapshot, selectedPrice, tradeModal, tradeQty])

  useEffect(() => {
    if (stocks.length === 0) return
    setPrices({})
    Promise.allSettled(stocks.map((s) => api_get_stock_latest_price(s.ticker)))
      .then((results) => {
        const map: Record<string, StockPriceDaily> = {}
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value.data) {
            map[stocks[i].ticker] = unwrap_price(r.value.data) as unknown as StockPriceDaily
          }
        })
        setPrices(map)
      })
  }, [stocks])

  const handleMarketChange = useCallback((nextMarket: MarketFilter) => {
    setMarket(nextMarket)
    setPage(1)
  }, [])

  const handleViewFilterChange = useCallback((nextFilter: StockViewFilter) => {
    setViewFilter(nextFilter)
    setPage(1)
  }, [])

  return {
    account,
    allStocks,
    canSubmitTrade,
    cashBalance,
    closeTradeModal,
    expectedCash,
    handleClear,
    handleKeyDown,
    handleMarketChange,
    handleSearch,
    handleViewFilterChange,
    holdings,
    holdingsByTicker,
    isSearchMode: keyword.trim() !== '',
    keyword,
    loading,
    market,
    openTradeModal,
    orderAmount,
    page,
    prices,
    recentTrades,
    searchInput,
    selectedHolding,
    selectedPrice,
    setPage,
    setSearchInput,
    setTradeMessage,
    setTradeModal,
    setTradeQty,
    stocks,
    submitTrade,
    total,
    totalPages,
    tradeLoading,
    tradeMessage,
    tradeModal,
    tradeQty,
    viewFilter,
    LIMIT,
  }
}
