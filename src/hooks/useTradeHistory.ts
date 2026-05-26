import { useCallback, useEffect, useMemo, useState } from 'react'
import { api_get_stock_latest_price, type StockPriceDaily } from '../api/stocks'
import {
  api_get_holdings,
  api_get_trades,
  api_get_trading_account,
  type Holding,
  type Trade,
  type TradingAccount,
} from '../api/trading'

export type TradeHistoryPeriod = '1주' | '1개월' | '3개월' | '전체'

export interface HoldingStatus extends Holding {
  averagePriceNum: number
  currentPrice: number
  investedAmount: number
  evaluationAmount: number
  profitAmount: number
  profitRate: number
}

const PERIOD_DAYS: Record<Exclude<TradeHistoryPeriod, '전체'>, number> = {
  '1주': 7,
  '1개월': 30,
  '3개월': 90,
}

export const parse_number = (value: unknown) => {
  if (typeof value === 'string') {
    const normalized = value.replaceAll(',', '').replace('%', '').trim()
    const n = Number(normalized)
    return Number.isNaN(n) ? 0 : n
  }
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

export const format_money = (value: unknown) =>
  `${Math.round(parse_number(value)).toLocaleString()}원`

export const format_rate = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

export const format_datetime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const get_latest_price = (data?: StockPriceDaily) =>
  parse_number(data?.closePrice ?? (data as any)?.currentPrice ?? (data as any)?.price)

const error_message = (error: unknown) => {
  const err = error as any
  const msg = err?.response?.data?.message ?? err?.message
  if (Array.isArray(msg)) return msg[0]
  return typeof msg === 'string' ? msg : '투자 내역을 불러오지 못했습니다.'
}

const is_after_period = (trade: Trade, period: TradeHistoryPeriod) => {
  if (period === '전체') return true
  const createdAt = new Date(trade.createdAt)
  if (Number.isNaN(createdAt.getTime())) return true
  const since = new Date()
  since.setDate(since.getDate() - PERIOD_DAYS[period])
  return createdAt >= since
}

export function useTradeHistory() {
  const [period, setPeriod] = useState<TradeHistoryPeriod>('1개월')
  const [account, setAccount] = useState<TradingAccount | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accountRes, holdingsRes, tradesRes] = await Promise.allSettled([
        api_get_trading_account(),
        api_get_holdings(),
        api_get_trades({ page: 1, limit: 100 }),
      ])

      if (accountRes.status === 'fulfilled') setAccount(accountRes.value.data)
      if (holdingsRes.status === 'fulfilled') setHoldings(holdingsRes.value.data)
      if (tradesRes.status === 'fulfilled') setTrades(tradesRes.value.data.items ?? [])

      const nextHoldings = holdingsRes.status === 'fulfilled' ? holdingsRes.value.data : []
      const latestPrices = await Promise.allSettled(
        nextHoldings.map((holding) => api_get_stock_latest_price(holding.ticker)),
      )
      const nextPrices: Record<string, number> = {}
      latestPrices.forEach((result, index) => {
        const ticker = nextHoldings[index]?.ticker
        if (!ticker || result.status !== 'fulfilled') return
        const price = get_latest_price(result.value.data)
        if (price > 0) nextPrices[ticker] = price
      })
      setPrices(nextPrices)

      if ([accountRes, holdingsRes, tradesRes].every((result) => result.status === 'rejected')) {
        const rejected = accountRes.status === 'rejected' ? accountRes : undefined
        setError(error_message(rejected?.reason))
      }
    } catch (err) {
      setError(error_message(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const holdingStatuses = useMemo<HoldingStatus[]>(() =>
    holdings.map((holding) => {
      const averagePriceNum = parse_number(holding.averagePrice)
      const currentPrice = prices[holding.ticker] || averagePriceNum
      const investedAmount = averagePriceNum * holding.quantity
      const evaluationAmount = currentPrice * holding.quantity
      const profitAmount = evaluationAmount - investedAmount
      const profitRate = investedAmount > 0 ? (profitAmount / investedAmount) * 100 : 0
      return {
        ...holding,
        averagePriceNum,
        currentPrice,
        investedAmount,
        evaluationAmount,
        profitAmount,
        profitRate,
      }
    }), [holdings, prices])

  const filteredTrades = useMemo(() =>
    trades.filter((trade) => is_after_period(trade, period)),
  [period, trades])

  const summary = useMemo(() => {
    const cashBalance = parse_number(account?.cashBalance)
    const seedMoney = parse_number(account?.seedMoney)
    const stockValue = holdingStatuses.reduce((sum, holding) => sum + holding.evaluationAmount, 0)
    const totalAsset = cashBalance + stockValue
    const totalProfit = seedMoney > 0 ? totalAsset - seedMoney : holdingStatuses.reduce((sum, holding) => sum + holding.profitAmount, 0)
    const totalProfitRate = seedMoney > 0 ? (totalProfit / seedMoney) * 100 : 0
    return {
      cashBalance,
      seedMoney,
      stockValue,
      totalAsset,
      totalProfit,
      totalProfitRate,
      holdingCount: holdingStatuses.length,
      tradeCount: filteredTrades.length,
    }
  }, [account, filteredTrades.length, holdingStatuses])

  const exportCsv = useCallback(() => {
    const rows = [
      ['구분', '종목코드', '종목명', '수량', '평균단가', '현재가', '평가금액', '손익', '수익률'],
      ...holdingStatuses.map((holding) => [
        '보유',
        holding.ticker,
        holding.companyName,
        String(holding.quantity),
        String(Math.round(holding.averagePriceNum)),
        String(Math.round(holding.currentPrice)),
        String(Math.round(holding.evaluationAmount)),
        String(Math.round(holding.profitAmount)),
        holding.profitRate.toFixed(2),
      ]),
      [],
      ['거래일시', '거래구분', '종목코드', '종목명', '수량', '체결가', '거래금액', '실현손익'],
      ...filteredTrades.map((trade) => [
        format_datetime(trade.createdAt),
        trade.tradeType === 'BUY' ? '매수' : '매도',
        trade.ticker,
        trade.companyName,
        String(trade.quantity),
        String(Math.round(parse_number(trade.price))),
        String(Math.round(parse_number(trade.totalAmount))),
        trade.realizedProfit ? String(Math.round(parse_number(trade.realizedProfit))) : '',
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stockmate-trades-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [filteredTrades, holdingStatuses])

  return {
    period,
    setPeriod,
    account,
    holdings: holdingStatuses,
    trades: filteredTrades,
    summary,
    loading,
    error,
    reload: load,
    exportCsv,
  }
}
