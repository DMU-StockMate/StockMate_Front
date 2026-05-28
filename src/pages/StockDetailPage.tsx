import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import type { StockDetail, StockSummary, StockPriceDaily } from '../api/stocks'
import { useStockDetailData, type StockChartPeriod } from '../hooks/useStockDetailData'
import { useWatchlist } from '../hooks/useWatchlist'

const PERIOD_LABELS: Record<StockChartPeriod, string> = { daily: '일봉', weekly: '주봉', monthly: '월봉' }

const to_num = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v.replaceAll(',', '').replace('%', '').trim()) : Number(v)
  return isNaN(n) ? 0 : n
}

const fmt_price = (v: unknown) => {
  const n = to_num(v)
  return n > 0 ? `${n.toLocaleString()}원` : '-'
}

const fmt_rate = (v: unknown) => {
  const n = to_num(v)
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
}

const fmt_val = (v: unknown, unit = '') => {
  const n = to_num(v)
  return n !== 0 ? `${n.toLocaleString()}${unit}` : '-'
}

const fmt_indicator = (v: unknown, unit = '') => {
  const n = to_num(v)
  return n !== 0 ? `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}` : '-'
}

const fmt_market_cap = (v: unknown) => {
  const n = to_num(v)
  return n > 0 ? `${Math.round(n / 100000000).toLocaleString()}억` : '-'
}

const as_object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {}

const unwrap_payload = (value: unknown) => {
  const obj = as_object(value)
  const nested = as_object(
    obj.data ?? obj.summary ?? obj.price ?? obj.latestPrice ?? obj.latest,
  )
  return { ...nested, ...obj }
}

const pick_num = (...sources: unknown[]) => {
  for (const source of sources) {
    const value = to_num(source)
    if (value !== 0) return value
  }
  return 0
}

const pick_text = (...sources: unknown[]) => {
  for (const source of sources) {
    if (typeof source === 'string' && source.trim()) return source
    if (typeof source === 'number') return String(source)
  }
  return ''
}

const get_price_summary = (summary: StockSummary | null, stock: StockDetail | null) => {
  const s = unwrap_payload(summary)
  const stockObj = as_object(stock)
  const detail = as_object(stockObj.detail)

  return {
    currentPrice: pick_num(s.currentPrice, s.closePrice, s.price, s.close, s.tradePrice, stockObj.currentPrice, stockObj.closePrice),
    changeRate: pick_num(
      s.changeRate,
      s.change_rate,
      s.rate,
      s.changePercent,
      s.change_percent,
      s.fluctuationRate,
      s.fluctuation_rate,
      s.signedChangeRate,
      s.signed_change_rate,
      stockObj.changeRate,
      stockObj.change_rate,
      stockObj.rate,
    ),
    volume: pick_num(s.volume, s.accTradeVolume, s.tradingVolume, stockObj.volume),
    marketCap: pick_num(s.marketCap, s.marketCapitalization, s.market_cap, detail.marketCap),
    highPrice: pick_num(s.highPrice, s.high),
    lowPrice: pick_num(s.lowPrice, s.low),
    openPrice: pick_num(s.openPrice, s.open),
    sector: pick_text(s.sector, s.sectorName, stockObj.sector),
  }
}

const price_of = (row: StockPriceDaily, keys: string[]) => {
  const record = row as unknown as Record<string, unknown>
  for (const key of keys) {
    const value = to_num(record[key])
    if (value > 0) return value
  }
  return 0
}

const date_of = (row: StockPriceDaily) => {
  const record = row as unknown as Record<string, unknown>
  return String(record.tradeDate ?? record.date ?? record.baseDate ?? '')
}

/* ── SVG 봉차트 ── */
function PriceChart({ data }: { data: StockPriceDaily[] }) {
  const [zoom, setZoom] = useState(8)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const MIN_ZOOM = 4
  const MAX_ZOOM = 18
  const candles = data
    .map((d) => ({
      date: date_of(d),
      open: price_of(d, ['openPrice', 'open']),
      high: price_of(d, ['highPrice', 'high']),
      low: price_of(d, ['lowPrice', 'low']),
      close: price_of(d, ['closePrice', 'close']),
      volume: to_num((d as unknown as Record<string, unknown>).volume),
    }))
    .filter((d) => d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0)

  const lows = candles.map((d) => d.low)
  const highs = candles.map((d) => d.high)
  const minY = candles.length > 0 ? Math.min(...lows) : 0
  const maxY = candles.length > 0 ? Math.max(...highs) : 1
  const range = maxY - minY || 1
  const H = 320
  const PAD = { top: 18, right: 104, bottom: 28, left: 12 }
  const priceH = 220
  const volumeTop = PAD.top + priceH + 18
  const volumeH = H - volumeTop - PAD.bottom
  const n = candles.length
  const slot = zoom
  const cW = Math.max(820, n * slot)
  const W = PAD.left + cW + PAD.right
  const candleW = Math.max(4, Math.min(16, slot * 0.58))
  const maxVolume = Math.max(...candles.map((d) => d.volume), 1)

  const px = (i: number) => PAD.left + slot * i + slot / 2
  const py = (price: number) => PAD.top + ((maxY - price) / range) * priceH
  const format_axis_price = (value: number) =>
    value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value.toLocaleString()
  const moving_average = (period: number) =>
    candles.map((_, i) => {
      if (i < period - 1) return null
      const slice = candles.slice(i - period + 1, i + 1)
      return slice.reduce((sum, d) => sum + d.close, 0) / period
    })
  const ma_lines = [
    { period: 5, color: '#059669', values: moving_average(5) },
    { period: 20, color: '#ef4444', values: moving_average(20) },
    { period: 60, color: '#f97316', values: moving_average(60) },
    { period: 120, color: '#7e22ce', values: moving_average(120) },
  ]
  const line_path = (values: Array<number | null>) =>
    values.reduce((path, value, i) => {
      if (value === null) return path
      return `${path}${path ? ' L' : 'M'}${px(i)} ${py(value)}`
    }, '')

  const ySteps = 5
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => minY + (range * i) / ySteps)
  const xStep = Math.max(1, Math.floor(n / 8))
  const xLabelIdxs = [...new Set([0, ...Array.from({ length: 7 }, (_, i) => Math.min(n - 1, xStep * (i + 1))), n - 1])]
  const latest = candles[candles.length - 1]
  const latestY = latest ? py(latest.close) : 0
  const latestColor = latest && latest.close >= latest.open ? '#ef4444' : '#2563eb'
  const selected =
    selectedIndex !== null ? candles[Math.min(Math.max(selectedIndex, 0), candles.length - 1)] : null
  const selectedX = selectedIndex !== null ? px(Math.min(Math.max(selectedIndex, 0), candles.length - 1)) : 0
  const selectedY = selected ? py(selected.close) : 0
  const selectedColor = selected && selected.close >= selected.open ? '#ef4444' : '#2563eb'
  const tooltipWidth = 170
  const tooltipHeight = 126
  const tooltipX = selected
    ? Math.min(Math.max(PAD.left, selectedX + 14), PAD.left + cW - tooltipWidth - 8)
    : 0
  const tooltipY = selected
    ? Math.min(Math.max(PAD.top, selectedY - tooltipHeight - 14), volumeTop - tooltipHeight - 18)
    : 0

  const updateSelectedFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const svgX = ((event.clientX - rect.left) / rect.width) * W
    const index = Math.round((svgX - PAD.left - slot / 2) / slot)

    if (index >= 0 && index < candles.length) {
      setSelectedIndex(index)
    }
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth
  }, [data, zoom])

  const handleWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const el = scrollRef.current
    const rect = el?.getBoundingClientRect()
    const pointerOffset = rect ? event.clientX - rect.left : 0
    const anchorRatio = el ? (el.scrollLeft + pointerOffset) / W : 1
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, zoom + (event.deltaY < 0 ? 1 : -1)),
    )

    if (nextZoom === zoom) return

    const nextChartWidth =
      PAD.left + Math.max(820, candles.length * nextZoom) + PAD.right

    setZoom(nextZoom)

    requestAnimationFrame(() => {
      if (!el) return
      el.scrollLeft = Math.max(0, anchorRatio * nextChartWidth - pointerOffset)
    })
  }

  if (candles.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
        차트 데이터가 없습니다
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 12 }}>{candles.length.toLocaleString()}개 봉</span>
          {ma_lines.map((line) => (
            <span key={line.period} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t3)' }}>
              <span style={{ width: 14, height: 2, background: line.color, display: 'inline-block' }} />
              MA{line.period}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bi bi-zoom-out" style={{ color: 'var(--t3)', fontSize: 13 }} />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: 140 }}
          />
          <i className="bi bi-zoom-in" style={{ color: 'var(--t3)', fontSize: 13 }} />
        </div>
      </div>
      <div
        ref={scrollRef}
        onWheel={handleWheelZoom}
        style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, overscrollBehavior: 'contain' }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={updateSelectedFromPointer}
          onPointerDown={updateSelectedFromPointer}
          onPointerLeave={() => setSelectedIndex(null)}
          style={{ width: W, minWidth: '100%', height: H, display: 'block', background: '#fff', touchAction: 'pan-x' }}
        >
          {yLabels.map((val, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={py(val)} x2={PAD.left + cW} y2={py(val)}
                stroke="#e5e7eb" strokeWidth={0.8} />
              <text x={PAD.left + cW + 12} y={py(val) + 5} textAnchor="start" fontSize={12} fill="#8b95a1">
                {format_axis_price(val)}
              </text>
            </g>
          ))}
          {xLabelIdxs.map((i) => (
            <line key={`grid-${i}`} x1={px(i)} y1={PAD.top} x2={px(i)} y2={volumeTop + volumeH}
              stroke="#edf0f3" strokeWidth={0.8} />
          ))}
          {latest && (
            <g>
              <line x1={PAD.left} y1={latestY} x2={PAD.left + cW} y2={latestY}
                stroke={latestColor} strokeWidth={1} strokeDasharray="2 4" />
              <rect x={PAD.left + cW + 8} y={latestY - 15} width={86} height={30} rx={4} fill={latestColor} />
              <text x={PAD.left + cW + 51} y={latestY + 5} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={700}>
                {latest.close.toLocaleString()}
              </text>
            </g>
          )}
          <line x1={PAD.left} y1={volumeTop - 8} x2={PAD.left + cW} y2={volumeTop - 8} stroke="#9ca3af" strokeWidth={0.8} />
          {candles.map((d, i) => {
            const isUp = d.close >= d.open
            const color = isUp ? '#ef4444' : '#2563eb'
            const x = px(i)
            const bodyTop = py(Math.max(d.open, d.close))
            const bodyBottom = py(Math.min(d.open, d.close))
            const bodyH = Math.max(2, bodyBottom - bodyTop)
            const volH = (d.volume / maxVolume) * volumeH
            return (
              <g key={`${d.date}-${i}`}>
                <line x1={x} y1={py(d.high)} x2={x} y2={py(d.low)} stroke={color} strokeWidth={1.2} />
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  rx={1.5}
                  fill={color}
                  stroke={color}
                  strokeWidth={1.2}
                />
                {d.volume > 0 && (
                  <rect
                    x={x - candleW / 2}
                    y={volumeTop + volumeH - volH}
                    width={candleW}
                    height={Math.max(1, volH)}
                    rx={1}
                    fill={isUp ? 'rgba(239,68,68,0.2)' : 'rgba(37,99,235,0.2)'}
                  />
                )}
              </g>
            )
          })}
          {ma_lines.map((line) => (
            <path key={line.period} d={line_path(line.values)} fill="none" stroke={line.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {selected && (
            <g pointerEvents="none">
              <line x1={selectedX} y1={PAD.top} x2={selectedX} y2={volumeTop + volumeH}
                stroke="#8b95a1" strokeWidth={1} strokeDasharray="5 5" />
              <line x1={PAD.left} y1={selectedY} x2={PAD.left + cW} y2={selectedY}
                stroke={selectedColor} strokeWidth={1} strokeDasharray="2 4" />
              <rect x={PAD.left + cW + 8} y={selectedY - 14} width={86} height={28} rx={4} fill={selectedColor} />
              <text x={PAD.left + cW + 51} y={selectedY + 5} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700}>
                {selected.close.toLocaleString()}
              </text>
              <rect x={selectedX - 40} y={H - 26} width={80} height={22} rx={4} fill="#111827" opacity={0.9} />
              <text x={selectedX} y={H - 11} textAnchor="middle" fontSize={11} fill="#fff">
                {selected.date}
              </text>
              <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx={8} fill="#fff" stroke="#d1d5db" filter="drop-shadow(0 8px 18px rgba(15,23,42,0.12))" />
              <text x={tooltipX + 12} y={tooltipY + 22} fontSize={12} fontWeight={800} fill="#111827">
                {selected.date}
              </text>
              {[
                ['시가', selected.open],
                ['고가', selected.high],
                ['저가', selected.low],
                ['종가', selected.close],
                ['거래량', selected.volume],
              ].map(([label, value], i) => (
                <g key={label}>
                  <text x={tooltipX + 12} y={tooltipY + 44 + i * 16} fontSize={11} fill="#8b95a1">
                    {label}
                  </text>
                  <text x={tooltipX + tooltipWidth - 12} y={tooltipY + 44 + i * 16} textAnchor="end" fontSize={11} fontWeight={700} fill="#111827">
                    {Number(value).toLocaleString()}
                  </text>
                </g>
              ))}
            </g>
          )}
          {xLabelIdxs.map((i) => (
            <text key={i} x={px(i)} y={H - 7} textAnchor="middle" fontSize={9} fill="var(--t3)">
              {candles[i]?.date?.slice(5) ?? ''}
            </text>
          ))}
          <rect x={PAD.left} y={PAD.top} width={cW} height={volumeTop + volumeH - PAD.top} fill="transparent" />
        </svg>
      </div>
    </div>
  )
}

/* ── 메인 페이지 ── */
export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const {
    account,
    chartData,
    chartLoading,
    dividends,
    financials,
    holdings,
    indicators,
    loading,
    modal,
    period,
    qty,
    setModal,
    setPeriod,
    setQty,
    stock,
    submitTrade,
    summary,
    tradeLoading,
    tradeMessage,
  } = useStockDetailData(ticker)
  const watchlist = useWatchlist()

  if (loading) {
    return (
      <AppLayout topbarPlaceholder="종목 검색">
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--t2)' }}>종목 정보를 불러오는 중...</div>
      </AppLayout>
    )
  }

  if (!stock) {
    return (
      <AppLayout topbarPlaceholder="종목 검색">
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--t3)' }}>
          종목을 찾을 수 없습니다.
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => navigate('/trade/stocks')}>← 종목 목록으로</Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const marketSummary = get_price_summary(summary, stock)
  const currentPrice = marketSummary.currentPrice
  const changeRate = marketSummary.changeRate
  const isUp = changeRate >= 0
  const priceColor = isUp ? 'var(--up)' : 'var(--down)'
  const isWatchlisted = watchlist.isInWatchlist(stock.ticker)
  const currentHolding = holdings.find((holding) => holding.ticker === stock.ticker)
  const virtualCash = to_num(account?.cashBalance)
  const totalOrderPrice = currentPrice * qty
  const canSubmitTrade =
    qty > 0 &&
    !tradeLoading &&
    currentPrice > 0 &&
    (modal.mode === 'buy'
      ? virtualCash >= totalOrderPrice
      : (currentHolding?.quantity ?? 0) >= qty)
  const indicatorValues = indicators?.indicators
  const hasFinancialIndicators = Boolean(
    indicators?.dataAvailability?.financialIndicators ||
    (indicatorValues && Object.values(indicatorValues).some((value) => to_num(value) !== 0)),
  )
  const hasBasicIndicators = Boolean(
    indicators && [
      indicators.marketCap,
      indicators.estimatedMarketCap,
      indicators.totalShares,
      indicators.currentPrice,
      indicators.previousClosePrice,
    ].some((value) => to_num(value) !== 0),
  )
  const hasIndicators = hasFinancialIndicators || hasBasicIndicators

  const submit_trade = () => submitTrade(currentPrice, canSubmitTrade)

  return (
    <AppLayout topbarPlaceholder="종목 검색" hasWishlist>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/trade')}>모의투자</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => navigate('/trade/stocks')}>전체 종목</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{stock.companyName}</span>
      </div>

      {tradeMessage && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            border: `1px solid ${tradeMessage.type === 'success' ? 'var(--up)' : 'var(--down)'}`,
            color: tradeMessage.type === 'success' ? 'var(--up)' : 'var(--down)',
            boxShadow: 'none',
          }}
        >
          {tradeMessage.text}
        </div>
      )}

      {watchlist.error && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            border: '1px solid var(--up)',
            color: 'var(--up)',
            boxShadow: 'none',
          }}
        >
          {watchlist.error}
        </div>
      )}

      {/* ── 헤더 카드 ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="logo-sm" style={{ width: 52, height: 52, borderRadius: 14, fontSize: 18, flexShrink: 0 }}>
              {stock.companyName.slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)' }}>{stock.companyName}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="muted">{stock.ticker}</span>
                {stock.market && <span className="muted">· {stock.market}</span>}
                {(marketSummary.sector || stock.sector) && <span className="muted">· {marketSummary.sector || stock.sector}</span>}
                <span style={{
                  fontSize: 12, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                  background: stock.status === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(107,101,128,0.12)',
                  color: stock.status === 'ACTIVE' ? 'var(--success)' : 'var(--t3)',
                }}>
                  {stock.status === 'ACTIVE' ? '거래가능' : stock.status === 'SUSPENDED' ? '거래정지' : '상장폐지'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {currentPrice > 0 ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2 }}>{currentPrice.toLocaleString()}원</div>
                <div style={{ color: priceColor, fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                  {fmt_rate(changeRate)}
                </div>
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>가격 정보 없음</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outline"
                disabled={watchlist.actionTicker === stock.ticker}
                title={isWatchlisted ? '관심 종목 삭제' : '관심 종목 추가'}
                onClick={() => void watchlist.toggleStock(stock)}
              >
                <i className={`bi ${isWatchlisted ? 'bi-star-fill' : 'bi-star'}`} />
                {isWatchlisted ? '관심종목 해제' : '관심종목'}
              </Button>
              <Button variant="outline" onClick={() => { setModal({ open: true, mode: 'sell' }); setQty(1) }}>
                매도
              </Button>
              <Button disabled={stock.status !== 'ACTIVE'} onClick={() => { setModal({ open: true, mode: 'buy' }); setQty(1) }}>
                매수
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 차트 카드 ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>주가 차트</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['daily', 'weekly', 'monthly'] as StockChartPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  height: 32, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: period === p ? 'var(--primary)' : '#fff',
                  color: period === p ? '#fff' : 'var(--t2)',
                  transition: 'all 0.15s',
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {chartLoading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)', fontSize: 13 }}>
            차트를 불러오는 중...
          </div>
        ) : (
          <PriceChart data={chartData} />
        )}
        {chartData.length > 0 && (
          <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {[
              { label: '시가', value: fmt_price(price_of(chartData[chartData.length - 1], ['openPrice', 'open'])) },
              { label: '고가', value: fmt_price(price_of(chartData[chartData.length - 1], ['highPrice', 'high'])) },
              { label: '저가', value: fmt_price(price_of(chartData[chartData.length - 1], ['lowPrice', 'low'])) },
              { label: '종가', value: fmt_price(price_of(chartData[chartData.length - 1], ['closePrice', 'close'])) },
              { label: '거래량', value: fmt_val((chartData[chartData.length - 1] as unknown as Record<string, unknown>).volume, '주') },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="label" style={{ marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 시장 요약 + 투자 지표 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <div className="section-title" style={{ marginBottom: 16 }}>시장 요약</div>
          {summary || currentPrice > 0 || marketSummary.volume > 0 || marketSummary.marketCap > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: '현재가', value: fmt_price(currentPrice) },
                { label: '등락률', value: fmt_rate(changeRate) },
                { label: '거래량', value: marketSummary.volume ? fmt_val(marketSummary.volume, '주') : '-' },
                { label: '시가총액', value: fmt_market_cap(marketSummary.marketCap) },
              ].map(({ label, value }) => (
                <div key={label} className="metric">
                  <div className="lbl">{label}</div>
                  <div className="val" style={{ fontSize: 15 }}>{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>시장 데이터가 없습니다</div>
          )}
        </Card>

        <Card>
          <div className="section-title" style={{ marginBottom: 16 }}>투자 지표</div>
          {hasIndicators ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'PER', value: fmt_indicator(indicatorValues?.per, '배') },
                { label: 'PBR', value: fmt_indicator(indicatorValues?.pbr, '배') },
                { label: 'ROE', value: fmt_indicator(indicatorValues?.roe, '%') },
                { label: 'EPS', value: fmt_indicator(indicatorValues?.eps, '원') },
                { label: 'BPS', value: fmt_indicator(indicatorValues?.bps, '원') },
                { label: '배당수익률', value: fmt_indicator(indicatorValues?.dividendYield, '%') },
                { label: '시가총액', value: fmt_market_cap(indicators?.marketCap ?? indicators?.estimatedMarketCap) },
                { label: '상장주식수', value: fmt_val(indicators?.totalShares, '주') },
              ].map(({ label, value }) => (
                <div key={label} className="metric">
                  <div className="lbl">{label}</div>
                  <div className="val" style={{ fontSize: 15 }}>{value}</div>
                </div>
              ))}
              {(indicators?.indicatorTradeDate || indicators?.tradeDate) && (
                <div className="muted" style={{ gridColumn: '1 / -1', fontSize: 12, paddingTop: 4 }}>
                  기준일 {indicators.indicatorTradeDate ?? indicators.tradeDate}
                  {!hasFinancialIndicators && ' · PER/PBR 등 재무지표는 수집 데이터가 없어 표시되지 않습니다'}
                </div>
              )}
            </div>
          ) : (
            <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>지표 데이터가 없습니다</div>
          )}
        </Card>
      </div>

      {/* ── 재무 정보 ── */}
      {financials && Object.keys(financials).length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>재무 정보</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {Object.entries(financials)
              .filter(([, v]) => v !== null && v !== undefined && v !== '')
              .map(([key, value]) => (
                <div key={key} className="metric">
                  <div className="lbl">{key}</div>
                  <div className="val" style={{ fontSize: 14 }}>
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* ── 배당 정보 ── */}
      {dividends.length > 0 && (
        <Card style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 12px' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>배당 정보</div>
          </div>
          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--primary-subtle)' }}>
                {Object.keys(dividends[0]).map((k) => (
                  <th key={k} style={{ paddingLeft: 24 }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dividends.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="muted" style={{ fontSize: 13, paddingLeft: 24 }}>
                      {typeof v === 'number' ? v.toLocaleString() : String(v ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── 매수/매도 모달 ── */}
      {modal.open && (
        <div className="modal-backdrop" onClick={() => setModal((m) => ({ ...m, open: false }))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ marginBottom: 18 }}>
              <h2>주문하기</h2>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--t2)' }}
                onClick={() => setModal((m) => ({ ...m, open: false }))}
              >×</button>
            </div>

            <div className="trade-tab" style={{ marginBottom: 18 }}>
              <button
                className={modal.mode === 'buy' ? 'active-tab' : 'inactive-tab'}
                onClick={() => setModal((m) => ({ ...m, mode: 'buy' }))}
              >매수</button>
              <button
                className={modal.mode === 'sell' ? 'active-tab' : 'inactive-tab'}
                style={modal.mode === 'sell' ? { background: 'var(--down)', color: '#fff' } : {}}
                onClick={() => setModal((m) => ({ ...m, mode: 'sell' }))}
              >매도</button>
            </div>

            <div className="card" style={{ background: 'var(--primary-subtle)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}>
              <div className="row">
                <div className="stock-cell">
                  <div className="logo-sm">{stock.companyName.slice(0, 2)}</div>
                  <div>
                    <div className="strong">{stock.companyName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{stock.ticker}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="strong" style={{ fontSize: 16 }}>{fmt_price(currentPrice)}</div>
                  <div style={{ color: priceColor, fontSize: 12, fontWeight: 600 }}>{fmt_rate(changeRate)}</div>
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

            <div className="card" style={{ background: 'var(--bg)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">예상 체결금액</span>
                <span className="strong">{totalOrderPrice.toLocaleString()}원</span>
              </div>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">보유 가용 자금</span>
                <span>{virtualCash.toLocaleString()}원</span>
              </div>
              <div className="row" style={{ fontSize: 13 }}>
                <span className="muted">{modal.mode === 'buy' ? '매수 후 잔여' : '매도 후 예수금'}</span>
                <span className="strong" style={{ color: 'var(--primary)' }}>
                  {(modal.mode === 'buy'
                    ? Math.max(0, virtualCash - totalOrderPrice)
                    : virtualCash + totalOrderPrice
                  ).toLocaleString()}원
                </span>
              </div>
              {modal.mode === 'sell' && (
                <div className="row" style={{ fontSize: 13, marginTop: 8 }}>
                  <span className="muted">보유 수량</span>
                  <span>{(currentHolding?.quantity ?? 0).toLocaleString()}주</span>
                </div>
              )}
            </div>

            <button
              className={`btn btn-lg ${modal.mode === 'buy' ? 'btn-up' : 'btn-down'}`}
              style={{ width: '100%' }}
              disabled={!canSubmitTrade}
              onClick={submit_trade}
            >
              {tradeLoading ? '주문 처리 중...' : modal.mode === 'buy' ? '매수하기' : '매도하기'}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
