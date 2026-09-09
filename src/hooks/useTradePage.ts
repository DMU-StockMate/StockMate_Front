import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api_get_stock_rankings_rise, api_get_stock_rankings_volume, type StockRankingItem } from '../api/stocks'
import { api_buy_stock, api_get_asset_rankings, api_sell_stock, type RankingUser } from '../api/trading'
import { useAuth } from './useAuth'
import { format_money as format_trade_money, format_rate as format_trade_rate, useTradeHistory } from './useTradeHistory'

const get_error_message = (error: unknown) => {
  const err = error as any
  const message = err?.response?.data?.message
  if (Array.isArray(message)) return message.join('\n')
  if (typeof message === 'string') return message
  return typeof err?.message === 'string' ? err.message : '주문 처리 중 오류가 발생했습니다.'
}

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
  const [tradeLoading, setTradeLoading] = useState(false)
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { summary, holdings, loading: assetLoading, trades, reload: reloadTradeHistory } = useTradeHistory()

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
    setTradeMessage(null)
  }

  const handle_close_modal = () => {
    if (tradeLoading) return
    setModal({ open: false, mode: 'buy' })
    setTradeMessage(null)
  }

  const unitPrice = modal.stock?.price ?? 0
  const virtualCash = summary.cashBalance
  const totalPrice = (unitPrice * qty).toLocaleString()
  const remaining = (
    modal.mode === 'buy'
      ? Math.max(0, virtualCash - unitPrice * qty)
      : virtualCash + unitPrice * qty
  ).toLocaleString()
  const heldQuantity = modal.stock ? holdings.find((h) => h.ticker === modal.stock?.ticker)?.quantity ?? 0 : 0
  const canSubmitTrade = Boolean(modal.stock)
    && qty > 0
    && !tradeLoading
    && (modal.mode === 'buy' ? unitPrice * qty <= virtualCash : heldQuantity >= qty)

  const handle_submit_trade = async () => {
    if (!modal.stock || !canSubmitTrade) return
    setTradeLoading(true)
    setTradeMessage(null)
    const payload = { ticker: modal.stock.ticker, quantity: qty, ...(unitPrice > 0 ? { price: unitPrice } : {}) }

    try {
      const { data } = modal.mode === 'buy'
        ? await api_buy_stock(payload)
        : await api_sell_stock(payload)
      setTradeMessage({
        type: 'success',
        text: `${data.trade.companyName} ${data.trade.quantity}주 ${modal.mode === 'buy' ? '매수' : '매도'} 체결`,
      })
      setModal({ open: false, mode: 'buy' })
      setQty(1)
      reloadTradeHistory()
    } catch (error) {
      setTradeMessage({ type: 'error', text: get_error_message(error) })
    } finally {
      setTradeLoading(false)
    }
  }
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
    canSubmitTrade, tradeLoading, tradeMessage, handle_submit_trade,
  }
}
