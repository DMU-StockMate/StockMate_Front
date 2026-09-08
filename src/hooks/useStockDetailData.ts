import { useCallback, useEffect, useState } from 'react'
import {
  api_get_stock,
  api_get_stock_latest_price,
  api_get_stock_summary,
  api_get_stock_prices,
  api_get_stocks,
  api_get_stock_indicators,
  api_get_stock_chart_daily,
  api_get_stock_chart_weekly,
  api_get_stock_chart_monthly,
  api_get_stock_investor_trend,
  api_get_stock_revenue_composition,
  api_subscribe_stock_realtime,
  type InvestorTrendDay,
  type RevenueCompositionItem,
  type StockDetail,
  type StockInvestmentIndicators,
  type StockSummary,
  type StockPriceDaily,
} from '../api/stocks'
import { api_sync_dart_indicators, api_get_stock_disclosures, api_get_stock_financial_summary, type DartDisclosure } from '../api/dart'
import {
  api_buy_stock,
  api_get_holdings,
  api_get_trading_account,
  api_sell_stock,
  type Holding,
  type TradingAccount,
} from '../api/trading'

export type StockChartPeriod = 'daily' | 'weekly' | 'monthly'

const as_object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {}

const unwrap_payload = (value: unknown) => {
  const obj = as_object(value)
  const nested = as_object(
    obj.data ?? obj.summary ?? obj.price ?? obj.latestPrice ?? obj.latest,
  )
  return { ...nested, ...obj }
}

const get_text = (obj: Record<string, unknown>, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

const date_of = (row: StockPriceDaily) => {
  const record = row as unknown as Record<string, unknown>
  return String(record.tradeDate ?? record.date ?? record.baseDate ?? '')
}

const get_chart_prices = (data: StockPriceDaily[] | { prices?: StockPriceDaily[]; items?: StockPriceDaily[]; data?: StockPriceDaily[] }) => {
  if (Array.isArray(data)) return data
  const payload = unwrap_payload(data)
  return data.prices ?? data.items ?? (Array.isArray(data.data) ? data.data : undefined) ??
    (payload.prices as StockPriceDaily[] | undefined) ??
    (payload.items as StockPriceDaily[] | undefined) ??
    (payload.content as StockPriceDaily[] | undefined) ??
    (payload.ohlcv as StockPriceDaily[] | undefined) ??
    []
}

const get_array = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data
  const obj = as_object(data)
  const nested = as_object(obj.data)
  const candidates = [
    obj.items,
    obj.stocks,
    obj.content,
    obj.results,
    obj.list,
    nested.items,
    nested.stocks,
    nested.content,
    nested.results,
    nested.list,
  ]
  return candidates.find(Array.isArray) as unknown[] ?? []
}

const get_stock_items = (data: unknown): StockDetail[] =>
  get_array(data).map(normalize_stock).filter((stock) => stock.ticker)

const get_stock_from_response = (data: unknown): StockDetail | null => {
  const obj = as_object(data)
  const nested = as_object(obj.data)
  const stock = obj.stock ?? nested.stock ?? obj.data ?? data
  const normalized = normalize_stock(stock)
  return normalized.ticker ? normalized : null
}

const normalize_stock = (value: unknown): StockDetail => {
  const obj = as_object(value)
  const sectorObj = as_object(obj.sector)
  const ticker = get_text(obj, ['ticker', 'stockCode', 'stock_code', 'code', 'symbol', 'shortCode'])
  const companyName = get_text(obj, ['companyName', 'stockName', 'stock_name', 'name', 'company_name'], ticker)
  const isActive = obj.isActive !== false && obj.active !== false
  const status = get_text(obj, ['status'], isActive ? 'ACTIVE' : 'SUSPENDED') as StockDetail['status']
  return {
    ...(obj as StockDetail),
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

const resolve_stock = async (ticker: string) => {
  try {
    const stockRes = await api_get_stock(ticker)
    const stock = get_stock_from_response(stockRes.data)
    if (stock) return { requestedTicker: stock.ticker, stock }
  } catch {}

  try {
    const summaryRes = await api_get_stock_summary(ticker)
    const stock = get_stock_from_response(summaryRes.data)
    if (stock) return { requestedTicker: stock.ticker, stock }
  } catch {}

  const { data } = await api_get_stocks({ keyword: ticker, status: 'ACTIVE', limit: 1 })
  const stock = get_stock_items(data)[0]
  if (stock) return { requestedTicker: stock.ticker, stock }

  const { data: allData } = await api_get_stocks({ status: 'ACTIVE' })
  const fallbackStock = get_stock_items(allData).find((item) =>
    [item.ticker, item.companyName].some((value) =>
      value?.toLowerCase().includes(ticker.toLowerCase()),
    ),
  )
  if (fallbackStock) return { requestedTicker: fallbackStock.ticker, stock: fallbackStock }

  throw new Error('종목을 찾을 수 없습니다.')
}

const normalize_summary = (summaryData: unknown, priceData: unknown): StockSummary => {
  const summaryObj = as_object(summaryData)
  const nested = as_object(summaryObj.data)
  const summaryPayload = as_object(summaryObj.summary ?? nested.summary ?? summaryData)
  const latestPayload = as_object(summaryObj.latestPrice ?? nested.latestPrice)
  return {
    ...summaryPayload,
    ...latestPayload,
    ...unwrap_payload(priceData),
  } as StockSummary
}

const sort_chart_prices = (rows: StockPriceDaily[]) =>
  [...rows].sort((a, b) => date_of(a).localeCompare(date_of(b)))

const get_number = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = obj[key]
    const numberValue = typeof value === 'string'
      ? Number(value.replaceAll(',', '').trim())
      : Number(value)
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue
  }
  return 0
}

const format_local_date = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const get_yesterday_date = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return format_local_date(date)
}

const merge_realtime_price_into_chart = (
  rows: StockPriceDaily[],
  realtimePayload: Record<string, unknown>,
  period: StockChartPeriod,
) => {
  const currentPrice = get_number(realtimePayload, ['currentPrice', 'price', 'closePrice', 'close'])
  if (currentPrice <= 0 || rows.length === 0) return rows

  const nextRows = [...rows]
  const lastIndex = nextRows.length - 1
  const last = as_object(nextRows[lastIndex])
  // 일봉은 endDate가 어제로 고정돼 있어 마지막 행이 '어제(마감된)' 캔들이다.
  // 오늘 날짜가 아니면 덮어쓰지 않고 오늘 캔들을 새로 추가한다.
  const isTodayRow = period !== 'daily' || date_of(nextRows[lastIndex]) === format_local_date(new Date())
  const openPrice = isTodayRow ? get_number(last, ['openPrice', 'open']) || currentPrice : currentPrice
  const highPrice = Math.max(isTodayRow ? get_number(last, ['highPrice', 'high']) || currentPrice : currentPrice, currentPrice)
  const lowPrice = isTodayRow ? Math.min(get_number(last, ['lowPrice', 'low']) || currentPrice, currentPrice) : currentPrice

  const mergedRow = {
    ...(isTodayRow ? (nextRows[lastIndex] as unknown as Record<string, unknown>) : {}),
    tradeDate: isTodayRow ? last.tradeDate : format_local_date(new Date()),
    openPrice,
    highPrice,
    lowPrice,
    closePrice: currentPrice,
    close: currentPrice,
    currentPrice,
  } as unknown as StockPriceDaily

  if (isTodayRow) {
    nextRows[lastIndex] = mergedRow
  } else {
    nextRows.push(mergedRow)
  }

  return nextRows
}

const get_error_message = (error: unknown) => {
  const err = error as { response?: { data?: { message?: string | string[] } } }
  const message = err.response?.data?.message
  if (Array.isArray(message)) return message.join('\n')
  return message ?? '주문 처리 중 오류가 발생했습니다.'
}

export function useStockDetailData(ticker?: string) {
  const [activeTicker, setActiveTicker] = useState(ticker ?? '')
  const [stock, setStock] = useState<StockDetail | null>(null)
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [chartData, setChartData] = useState<StockPriceDaily[]>([])
  const [financials, setFinancials] = useState<Record<string, unknown> | null>(null)
  const [indicators, setIndicators] = useState<StockInvestmentIndicators | null>(null)
  const [indicatorSyncing, setIndicatorSyncing] = useState(false)
  const [dividends] = useState<Record<string, unknown>[]>([])
  const [disclosures, setDisclosures] = useState<DartDisclosure[]>([])
  const [investorTrend, setInvestorTrend] = useState<InvestorTrendDay[]>([])
  const [investorTrendLoading, setInvestorTrendLoading] = useState(false)
  const [revenueComposition, setRevenueComposition] = useState<RevenueCompositionItem[]>([])
  const [revenueCompositionPeriod, setRevenueCompositionPeriod] = useState<string | null>(null)
  const [revenueCompositionLoading, setRevenueCompositionLoading] = useState(false)
  const [period, setPeriod] = useState<StockChartPeriod>('daily')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; mode: 'buy' | 'sell' }>({ open: false, mode: 'buy' })
  const [qty, setQty] = useState(1)
  const [account, setAccount] = useState<TradingAccount | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [tradeLoading, setTradeLoading] = useState(false)
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!ticker) return
    let cancelled = false
    setLoading(true)
    setStock(null)
    setSummary(null)
    setIndicators(null)
    setFinancials(null)
    setDisclosures([])

    resolve_stock(ticker)
      .then(async ({ requestedTicker, stock }) => {
        const [summaryRes, priceRes, indicatorsRes, financialsRes, disclosuresRes] = await Promise.all([
          api_get_stock_summary(requestedTicker).catch(() => ({ data: null })),
          api_get_stock_latest_price(requestedTicker).catch(() => ({ data: null })),
          api_get_stock_indicators(requestedTicker).catch(() => ({ data: null })),
          api_get_stock_financial_summary(requestedTicker).catch(() => ({ data: null })),
          api_get_stock_disclosures(requestedTicker).catch(() => ({ data: [] })),
        ])
        if (cancelled) return
        setActiveTicker(requestedTicker)
        setStock(stock)
        setSummary(normalize_summary(summaryRes.data, priceRes.data))
        setFinancials(financialsRes.data as Record<string, unknown> | null)
        setDisclosures(disclosuresRes.data ?? [])

        const freshIndicators = indicatorsRes.data as StockInvestmentIndicators | null
        setIndicators(freshIndicators)

        // 재무 지표가 없으면 DART에서 자동 동기화 후 재조회
        const hasFinancialData = Boolean(
          freshIndicators?.dataAvailability?.financialIndicators ||
          (freshIndicators?.indicators &&
            Object.values(freshIndicators.indicators).some((v) => v !== null && v !== undefined)),
        )
        if (!hasFinancialData) {
          setIndicatorSyncing(true)
          api_sync_dart_indicators(requestedTicker)
            .then(() => api_get_stock_indicators(requestedTicker))
            .then(({ data }) => {
              if (!cancelled) setIndicators(data as StockInvestmentIndicators)
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setIndicatorSyncing(false) })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => {
      cancelled = true
    }
  }, [ticker])

  useEffect(() => {
    if (!activeTicker) return

    void api_subscribe_stock_realtime([activeTicker]).catch(() => undefined)

    const updateRealtimePrice = async () => {
      try {
        const { data } = await api_get_stock_latest_price(activeTicker)
        const realtimePayload = unwrap_payload(data)

        setSummary((prev) => ({
          ...(prev ?? {}),
          ...realtimePayload,
          ticker: activeTicker,
        }) as StockSummary)
        setChartData((prev) =>
          merge_realtime_price_into_chart(prev, realtimePayload, period),
        )
      } catch {
        // 실시간 가격이 아직 캐시에 없으면 기존 상세 정보를 유지합니다.
      }
    }

    void updateRealtimePrice()
    const timer = window.setInterval(() => {
      void updateRealtimePrice()
    }, 5000)

    return () => {
      window.clearInterval(timer)
    }
  }, [activeTicker, period])

  useEffect(() => {
    if (!activeTicker) return
    let cancelled = false
    setInvestorTrendLoading(true)

    api_get_stock_investor_trend(activeTicker)
      .then(({ data }) => {
        if (!cancelled) setInvestorTrend(data.days ?? [])
      })
      .catch(() => {
        if (!cancelled) setInvestorTrend([])
      })
      .finally(() => {
        if (!cancelled) setInvestorTrendLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTicker])

  useEffect(() => {
    if (!activeTicker) return
    let cancelled = false
    setRevenueCompositionLoading(true)

    api_get_stock_revenue_composition(activeTicker)
      .then(({ data }) => {
        if (cancelled) return
        setRevenueComposition(data.items ?? [])
        setRevenueCompositionPeriod(data.period ?? null)
      })
      .catch(() => {
        if (!cancelled) {
          setRevenueComposition([])
          setRevenueCompositionPeriod(null)
        }
      })
      .finally(() => {
        if (!cancelled) setRevenueCompositionLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTicker])

  const loadTradingSnapshot = useCallback(() => {
    Promise.allSettled([
      api_get_trading_account(),
      api_get_holdings(),
    ]).then(([accountRes, holdingsRes]) => {
      if (accountRes.status === 'fulfilled') setAccount(accountRes.value.data)
      if (holdingsRes.status === 'fulfilled') setHoldings(holdingsRes.value.data)
    })
  }, [])

  useEffect(() => {
    loadTradingSnapshot()
  }, [loadTradingSnapshot])

  useEffect(() => {
    if (!activeTicker) return
    setChartLoading(true)
    const fn =
      period === 'daily' ? api_get_stock_chart_daily :
      period === 'weekly' ? api_get_stock_chart_weekly :
      api_get_stock_chart_monthly
    const chartParams = { endDate: get_yesterday_date() }
    fn(activeTicker, chartParams)
      .then(({ data }) => {
        const arr = get_chart_prices(data)
        if (period === 'daily' && arr.length <= 1) {
          return api_get_stock_prices(activeTicker, chartParams).then(({ data: ohlcvData }) => {
            const fallbackArr = get_chart_prices(ohlcvData)
            setChartData(sort_chart_prices(fallbackArr.length > arr.length ? fallbackArr : arr))
          })
        }
        setChartData(sort_chart_prices(arr))
      })
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false))
  }, [activeTicker, period])

  const submitTrade = useCallback(async (currentPrice: number, canSubmitTrade: boolean) => {
    if (!activeTicker || !canSubmitTrade) return
    setTradeLoading(true)
    setTradeMessage(null)

    try {
      const payload = {
        ticker: activeTicker,
        quantity: qty,
        price: currentPrice,
      }
      const { data } = modal.mode === 'buy'
        ? await api_buy_stock(payload)
        : await api_sell_stock(payload)

      setTradeMessage({
        type: 'success',
        text: `${data.trade.companyName} ${data.trade.quantity}주 ${modal.mode === 'buy' ? '매수' : '매도'} 체결`,
      })
      setModal({ open: false, mode: 'buy' })
      setQty(1)
      loadTradingSnapshot()
    } catch (error) {
      setTradeMessage({ type: 'error', text: get_error_message(error) })
    } finally {
      setTradeLoading(false)
    }
  }, [activeTicker, loadTradingSnapshot, modal.mode, qty])

  return {
    account,
    activeTicker,
    chartData,
    chartLoading,
    disclosures,
    dividends,
    financials,
    holdings,
    indicators,
    indicatorSyncing,
    investorTrend,
    investorTrendLoading,
    loading,
    modal,
    period,
    qty,
    revenueComposition,
    revenueCompositionLoading,
    revenueCompositionPeriod,
    setModal,
    setPeriod,
    setQty,
    stock,
    submitTrade,
    summary,
    tradeLoading,
    tradeMessage,
  }
}
