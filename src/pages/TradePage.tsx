import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import {
  api_get_stock_rankings_rise,
  api_get_stock_rankings_volume,
  type StockRankingItem,
} from '../api/stocks'
import {
  format_money as format_trade_money,
  format_rate as format_trade_rate,
  useTradeHistory,
} from '../hooks/useTradeHistory'

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

const get_items = (data: StockRankingItem[] | { items?: StockRankingItem[]; data?: StockRankingItem[] }) => {
  if (Array.isArray(data)) return data
  return data.items ?? data.data ?? []
}

const to_number = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value.replaceAll(',', '')) || 0
  return 0
}

const normalize_stock = (stock: StockRankingItem): MarketStock => {
  const ticker = stock.ticker ?? stock.code ?? stock.symbol ?? ''
  const name = stock.companyName ?? stock.name ?? ticker
  const price = to_number(stock.currentPrice ?? stock.closePrice ?? stock.price)
  const changeRate = to_number(stock.changeRate ?? stock.rate)
  return {
    name,
    ticker,
    market: stock.market,
    price,
    changeRate,
    changePrice: to_number(stock.changePrice ?? stock.change),
    volume: to_number(stock.volume),
    up: changeRate >= 0,
  }
}

const format_price = (price: number) =>
  price > 0 ? `${price.toLocaleString()}원` : '-'

const format_rate = (rate: number) =>
  `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`

export default function TradePage() {
  const navigate = useNavigate()
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'buy' })
  const [qty, setQty] = useState(2)
  const [riseStocks, setRiseStocks] = useState<MarketStock[]>([])
  const [volumeStocks, setVolumeStocks] = useState<MarketStock[]>([])
  const [loading, setLoading] = useState(true)
  const {
    summary,
    loading: assetLoading,
    trades,
  } = useTradeHistory()

  useEffect(() => {
    Promise.all([
      api_get_stock_rankings_rise(),
      api_get_stock_rankings_volume(),
    ])
      .then(([riseRes, volumeRes]) => {
        setRiseStocks(get_items(riseRes.data).map(normalize_stock))
        setVolumeStocks(get_items(volumeRes.data).map(normalize_stock))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handle_open_modal = (mode: 'buy' | 'sell', stock?: MarketStock) => {
    const selected = stock ?? riseStocks[0] ?? volumeStocks[0]
    if (!selected) {
      navigate('/trade/stocks')
      return
    }
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
  const todayTradeCount = trades.filter((trade) => new Date(trade.createdAt).toDateString() === today).length
  const profitText = `${summary.totalProfit >= 0 ? '+' : ''}${format_trade_money(summary.totalProfit)} (${format_trade_rate(summary.totalProfitRate)})`

  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div className="page-title">
        <div>
          <h1>모의투자</h1>
          <div className="page-sub">1주 단위로 안전하게 실전 감각을 익혀보세요</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => navigate('/trade/history')}>
            <i className="bi bi-clipboard-data" />
            투자 내역
          </Button>
          <Button variant="outline">
            <i className="bi bi-trophy" />
            랭킹전
          </Button>
          <Button onClick={() => navigate('/trade/stocks')}>
            <i className="bi bi-plus" />
            종목 둘러보기
          </Button>
        </div>
      </div>

      {/* 자산 hero + 빠른 액션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card variant="hero" className="card-lg" style={{ position: 'relative' }}>
          <div className="row">
            <div>
              <div className="label" style={{ opacity: 0.85 }}>평가 자산</div>
              <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>
                {assetLoading ? '불러오는 중' : format_trade_money(summary.totalAsset)}
              </div>
              <div style={{ marginTop: 8, fontSize: 14 }}>
                평가손익 <b>{assetLoading ? '-' : profitText}</b>
              </div>
              <div style={{ opacity: 0.85, fontSize: 12, marginTop: 4 }}>
                예수금 {format_trade_money(summary.cashBalance)} · 보유 평가 {format_trade_money(summary.stockValue)} · 보유 {summary.holdingCount.toLocaleString()}종목
              </div>
            </div>
            <div style={{ width: 240, height: 80 }}>
              <svg viewBox="0 0 240 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <polyline fill="rgba(255,255,255,0.18)" stroke="none" points="0,60 25,50 50,62 75,40 100,45 125,30 150,35 175,18 200,22 225,8 240,5 240,80 0,80" />
                <polyline fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" points="0,60 25,50 50,62 75,40 100,45 125,30 150,35 175,18 200,22 225,8 240,5" />
              </svg>
            </div>
          </div>
          <div className="row" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>
              오늘 거래 {todayTradeCount.toLocaleString()}건 · 최근 거래 {summary.tradeCount.toLocaleString()}건
            </span>
            <span
              style={{ fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate('/trade/history')}
            >
              오늘 내역 보기 →
            </span>
          </div>
        </Card>

        <div>
          <div className="section-title" style={{ marginBottom: 12, fontSize: 14 }}>투자 바로가기</div>
          <div className="action-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div className="action-card" style={{ minHeight: 154, justifyContent: 'center' }} onClick={() => navigate('/trade/stocks')}>
              <div className="ac-ico"><i className="bi bi-search" /></div>
              <div className="ac-name">종목 둘러보기</div>
              <div className="ac-desc">관심 종목을 찾고 주문하기</div>
            </div>
            <div className="action-card" style={{ minHeight: 154, justifyContent: 'center' }} onClick={() => navigate('/trade/history')}>
              <div className="ac-ico"><i className="bi bi-clipboard-data" /></div>
              <div className="ac-name">투자 내역</div>
              <div className="ac-desc">보유 현황과 거래 기록 확인</div>
            </div>
          </div>
        </div>
      </div>

      {/* 랭킹전 배너 */}
      <div className="ranking-banner" style={{ marginBottom: 20 }}>
        <div className="trophy-ico"><i className="bi bi-trophy-fill" /></div>
        <div style={{ flex: 1 }}>
          <div className="strong" style={{ fontSize: 14 }}>이번 주 랭킹전 진행 중 — 현재 순위 27위 / 312명</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>상위 10% 진입 시 추가 자금 +10,000원 · 5월 6일 마감</div>
        </div>
        <button className="btn btn-sm" style={{ background: '#fff', color: '#92400E' }}>참여하기 →</button>
      </div>

      {/* 보유 종목 + 최근 거래 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <Card>
          <div className="row" style={{ marginBottom: 14 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 0 }}>상승 랭킹</div>
              <div className="muted" style={{ fontSize: 12 }}>백엔드 랭킹 API 기준 실시간 후보 종목</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/trade/stocks')}>전체 종목</Button>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>랭킹을 불러오는 중...</div>
          ) : riseStocks.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>상승 랭킹 데이터가 없습니다.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>종목</th><th>시장</th><th>현재가</th><th>등락률</th><th>액션</th>
                </tr>
              </thead>
              <tbody>
                {riseStocks.slice(0, 5).map((stock) => (
                  <tr key={stock.ticker}>
                    <td>
                      <div className="stock-cell">
                        <div className="logo-sm">{stock.name.slice(0, 2)}</div>
                        <div>
                          <div className="strong">{stock.name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{stock.ticker}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{stock.market ?? '-'}</td>
                    <td className="strong">{format_price(stock.price)}</td>
                    <td className={stock.up ? 'price-up' : 'price-down'}>{format_rate(stock.changeRate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-up" onClick={() => handle_open_modal('buy', stock)}>매수</button>
                        <button className="btn btn-sm btn-outline" onClick={() => handle_open_modal('sell', stock)}>매도</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>거래량 랭킹</div>
            <span
              className="muted"
              style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }}
              onClick={() => navigate('/trade/stocks')}
            >
              전체 종목 →
            </span>
          </div>
          {loading ? (
            <div style={{ padding: '26px 0', textAlign: 'center', color: 'var(--t2)' }}>불러오는 중...</div>
          ) : volumeStocks.length === 0 ? (
            <div style={{ padding: '26px 0', textAlign: 'center', color: 'var(--t3)' }}>거래량 데이터가 없습니다.</div>
          ) : volumeStocks.slice(0, 5).map((stock, i) => (
            <div key={stock.ticker} className="activity-row">
              <div className="left">
                <span style={{
                  width: 24, height: 24, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>{i + 1}</span>
                <div>
                  <div className="strong" style={{ fontSize: 13 }}>{stock.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {stock.ticker} · 거래량 {stock.volume ? stock.volume.toLocaleString() : '-'}
                  </div>
                </div>
              </div>
              <div className={stock.up ? 'price-up' : 'price-down'} style={{ fontSize: 13 }}>{format_rate(stock.changeRate)}</div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 14 }}
            onClick={() => navigate('/trade/stocks')}
          >
            전체 종목 둘러보기
          </button>
        </Card>
      </div>

      {/* 매수/매도 모달 */}
      {modal.open && (
        <div className="modal-backdrop" onClick={handle_close_modal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ marginBottom: 18 }}>
              <h2>주문하기</h2>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--t2)' }}
                onClick={handle_close_modal}
              >×</button>
            </div>

            <div className="trade-tab" style={{ marginBottom: 18 }}>
              <button
                className={modal.mode === 'buy' ? 'active-tab' : 'inactive-tab'}
                onClick={() => setModal((m) => ({ ...m, mode: 'buy' }))}
              >
                매수
              </button>
              <button
                className={modal.mode === 'sell' ? 'active-tab' : 'inactive-tab'}
                style={{ ...(modal.mode === 'sell' ? { background: 'var(--down)', color: '#fff' } : {}) }}
                onClick={() => setModal((m) => ({ ...m, mode: 'sell' }))}
              >
                매도
              </button>
            </div>

            <div
              className="card"
              style={{ background: 'var(--primary-subtle)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}
            >
              <div className="row">
                <div className="stock-cell">
                  <div className="logo-sm">{modal.stock?.name.slice(0, 2)}</div>
                  <div>
                    <div className="strong">{modal.stock?.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{modal.stock?.ticker}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="strong" style={{ fontSize: 16 }}>{format_price(unitPrice)}</div>
                  <div className={modal.stock?.up ? 'price-up' : 'price-down'} style={{ fontSize: 12 }}>
                    {format_rate(modal.stock?.changeRate ?? 0)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div className="label" style={{ marginBottom: 10 }}>수량 (1주 단위)</div>
              <div className="stepper">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <div className="qty">{qty}</div>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            </div>

            <div
              className="card"
              style={{ background: 'var(--bg)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}
            >
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">예상 체결금액</span>
                <span className="strong">{totalPrice}원</span>
              </div>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">보유 가용 자금</span>
                <span>{virtualCash.toLocaleString()}원</span>
              </div>
              <div className="row" style={{ fontSize: 13 }}>
                <span className="muted">{modal.mode === 'buy' ? '매수 후 잔여' : '매도 후 예수금'}</span>
                <span className="strong" style={{ color: 'var(--primary)' }}>{remaining}원</span>
              </div>
            </div>

            <button
              className={`btn btn-lg ${modal.mode === 'buy' ? 'btn-up' : 'btn-down'}`}
              style={{ width: '100%' }}
              onClick={handle_close_modal}
            >
              {modal.mode === 'buy' ? '매수하기' : '매도하기'}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
