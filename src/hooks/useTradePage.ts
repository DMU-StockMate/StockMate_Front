import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api_get_stock_rankings_rise, api_get_stock_rankings_volume, type StockRankingItem } from '../api/stocks'
import { api_get_asset_rankings, type RankingUser } from '../api/trading'
import { useAuth } from './useAuth'
import { format_money as format_trade_money, format_rate as format_trade_rate, useTradeHistory } from './useTradeHistory'

interface MarketStock {
  name: string
  ticker: string
  market?: string
  price: number
  changeRate: number
  changePrice?: number
  volume?: number
  up: boolean
}

interface ModalState {
  open: boolean
  mode: 'buy' | 'sell'
  stock?: MarketStock
}

const to_number = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value.replaceAll(',', '')) || 0
  return 0
}

const get_items = (data: StockRankingItem[] | { items?: StockRankingItem[]; data?: StockRankingItem[] }) => {
  if (Array.isArray(data)) return data
  return data.items ?? data.data ?? []
}

const normalize_stock = (stock: StockRankingItem): MarketStock => {
  const ticker = stock.ticker ?? stock.code ?? stock.symbol ?? ''
  const name = stock.companyName ?? stock.name ?? ticker
  const price = to_number(stock.currentPrice ?? stock.closePrice ?? stock.price)
  const changeRate = to_number(stock.changeRate ?? stock.rate)
  return {
    name, ticker,
    market: stock.market,
    price, changeRate,
    changePrice: to_number(stock.changePrice ?? stock.change),
    volume: to_number(stock.volume),
    up: changeRate >= 0,
  }
}

export function useTradePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'buy' })
  const [qty, setQty] = useState(2)
  const [riseStocks, setRiseStocks] = useState<MarketStock[]>([])
  const [volumeStocks, setVolumeStocks] = useState<MarketStock[]>([])
  const [assetRanks, setAssetRanks] = useState<RankingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [rankLoading, setRankLoading] = useState(true)
  const { summary, loading: assetLoading, trades } = useTradeHistory()

  useEffect(() => {
    Promise.all([api_get_stock_rankings_rise(), api_get_stock_rankings_volume()])
      .then(([riseRes, volumeRes]) => {
        setRiseStocks(get_items(riseRes.data).map(normalize_stock))
        setVolumeStocks(get_items(volumeRes.data).map(normalize_stock))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api_get_asset_rankings({ limit: 100 })
      .then(({ data }) => setAssetRanks(data))
      .catch(() => setAssetRanks([]))
      .finally(() => setRankLoading(false))
  }, [])

  const handle_open_modal = (mode: 'buy' | 'sell', stock?: MarketStock) => {
    const selected = stock ?? riseStocks[0] ?? volumeStocks[0]
    if (!selected) { navigate('/trade/stocks'); return }
    setModal({ open: true, mode, stock: selected })
    setQty(1)
  }

  const handle_close_modal = () => setModal({ open: false, mode: 'buy' })

  const unitPrice = modal.stock?.price ?? 0
  const virtualCash = summary.cashBalance
  const totalPrice = (unitPrice * qty).toLocaleString()
  const remaining = (
    modal.mode === 'buy'
      ? Math.max(0, virtualCash - unitPrice * qty)
      : virtualCash + unitPrice * qty
  ).toLocaleString()
  const today = new Date().toDateString()
  const todayTradeCount = trades.filter((t) => new Date(t.createdAt).toDateString() === today).length
  const profitText = `${summary.totalProfit >= 0 ? '+' : ''}${format_trade_money(summary.totalProfit)} (${format_trade_rate(summary.totalProfitRate)})`
  const myRank = assetRanks.find((rank) => rank.userId === user?.id)
  const rankingText = rankLoading
    ? '랭킹 정보를 불러오는 중'
    : myRank
      ? `현재 순위 ${myRank.rank.toLocaleString()}위 / ${assetRanks.length.toLocaleString()}명`
      : assetRanks.length > 0
        ? `현재 순위 집계 전 / ${assetRanks.length.toLocaleString()}명`
        : '아직 랭킹 데이터가 없습니다'
  const rankingSubText = rankLoading
    ? '실제 자산 랭킹 API를 확인하고 있습니다'
    : '실제 자산 랭킹 API 기준으로 표시됩니다'

  return {
    modal, setModal, qty, setQty,
    riseStocks, volumeStocks, loading,
    assetRanks, rankLoading, myRank,
    summary, assetLoading, trades,
    unitPrice, virtualCash, totalPrice, remaining,
    todayTradeCount, profitText, rankingText, rankingSubText,
    handle_open_modal, handle_close_modal,
    format_trade_money,
  }
}
