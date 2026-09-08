import { useEffect, useRef, useState } from 'react'
import type { StockPriceDaily } from '../../api/stocks'
import { to_num, price_of, date_of } from '../../utils/format'

interface PriceChartProps {
  data: StockPriceDaily[]
}

const MIN_ZOOM = 4
const MAX_ZOOM = 18
const H = 320
const PAD = { top: 18, right: 104, bottom: 28, left: 12 }
const PRICE_H = 220

const MA_LINES = [
  { period: 5, color: '#059669' },
  { period: 20, color: '#ef4444' },
  { period: 60, color: '#f97316' },
  { period: 120, color: '#7e22ce' },
]

const moving_average = (candles: { close: number }[], period: number) =>
  candles.map((_, i) => {
    if (i < period - 1) return null
    const slice = candles.slice(i - period + 1, i + 1)
    return slice.reduce((sum, d) => sum + d.close, 0) / period
  })

const format_axis_price = (value: number) =>
  value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value.toLocaleString()

export default function PriceChart({ data }: PriceChartProps) {
  const [zoom, setZoom] = useState(8)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const candles = data
    .map((d) => {
      const row = d as unknown as Record<string, unknown>
      return {
        date: date_of(row),
        open: price_of(row, ['openPrice', 'open']),
        high: price_of(row, ['highPrice', 'high']),
        low: price_of(row, ['lowPrice', 'low']),
        close: price_of(row, ['closePrice', 'close']),
        volume: to_num(row.volume),
      }
    })
    .filter((d) => d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0)

  const volumeTop = PAD.top + PRICE_H + 18
  const volumeH = H - volumeTop - PAD.bottom
  const n = candles.length
  const slot = zoom
  const cW = Math.max(820, n * slot)
  const W = PAD.left + cW + PAD.right
  const candleW = Math.max(4, Math.min(16, slot * 0.58))
  const maxVolume = Math.max(...candles.map((d) => d.volume), 1)

  // Y축은 스크롤/줌으로 실제 보이는 구간의 캔들만 기준으로 잡는다.
  // 전체 데이터 기준으로 잡으면 과거 고점/저점 때문에 최근 구간이 눌려 보인다.
  const viewportWidth = scrollRef.current?.clientWidth ?? cW
  const startIdx = Math.max(0, Math.floor((scrollLeft - PAD.left) / slot))
  const endIdx = Math.min(n - 1, Math.ceil((scrollLeft + viewportWidth - PAD.left) / slot))
  const visibleCandles = n > 0 ? candles.slice(startIdx, endIdx + 1) : []
  const boundCandles = visibleCandles.length > 0 ? visibleCandles : candles
  const lows = boundCandles.map((d) => d.low)
  const highs = boundCandles.map((d) => d.high)
  const rawMinY = boundCandles.length > 0 ? Math.min(...lows) : 0
  const rawMaxY = boundCandles.length > 0 ? Math.max(...highs) : 1
  const yPadding = (rawMaxY - rawMinY) * 0.08 || rawMaxY * 0.02 || 1
  const minY = Math.max(0, rawMinY - yPadding)
  const maxY = rawMaxY + yPadding
  const range = maxY - minY || 1

  const px = (i: number) => PAD.left + slot * i + slot / 2
  const py = (price: number) => PAD.top + ((maxY - price) / range) * PRICE_H

  const ma_values = MA_LINES.map((line) => ({
    ...line,
    values: moving_average(candles, line.period),
  }))

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
  const selected = selectedIndex !== null
    ? candles[Math.min(Math.max(selectedIndex, 0), candles.length - 1)]
    : null
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

  const handle_pointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const svgX = ((event.clientX - rect.left) / rect.width) * W
    const index = Math.round((svgX - PAD.left - slot / 2) / slot)
    if (index >= 0 && index < candles.length) setSelectedIndex(index)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth
    setScrollLeft(el.scrollLeft)
  }, [data, zoom])

  const handle_scroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(event.currentTarget.scrollLeft)
  }

  const handle_wheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const el = scrollRef.current
    const rect = el?.getBoundingClientRect()
    const pointerOffset = rect ? event.clientX - rect.left : 0
    const anchorRatio = el ? (el.scrollLeft + pointerOffset) / W : 1
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + (event.deltaY < 0 ? 1 : -1)))
    if (nextZoom === zoom) return
    const nextChartWidth = PAD.left + Math.max(820, candles.length * nextZoom) + PAD.right
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
          {MA_LINES.map((line) => (
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
        onWheel={handle_wheel}
        onScroll={handle_scroll}
        style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, overscrollBehavior: 'contain' }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={handle_pointer}
          onPointerDown={handle_pointer}
          onPointerLeave={() => setSelectedIndex(null)}
          style={{ width: W, minWidth: '100%', height: H, display: 'block', background: '#fff', touchAction: 'pan-x' }}
        >
          {yLabels.map((val, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={py(val)} x2={PAD.left + cW} y2={py(val)} stroke="#e5e7eb" strokeWidth={0.8} />
              <text x={PAD.left + cW + 12} y={py(val) + 5} textAnchor="start" fontSize={12} fill="#8b95a1">
                {format_axis_price(val)}
              </text>
            </g>
          ))}
          {xLabelIdxs.map((i) => (
            <line key={`grid-${i}`} x1={px(i)} y1={PAD.top} x2={px(i)} y2={volumeTop + volumeH} stroke="#edf0f3" strokeWidth={0.8} />
          ))}
          {latest && (
            <g>
              <line x1={PAD.left} y1={latestY} x2={PAD.left + cW} y2={latestY} stroke={latestColor} strokeWidth={1} strokeDasharray="2 4" />
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
                <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH} rx={1.5} fill={color} stroke={color} strokeWidth={1.2} />
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
          {ma_values.map((line) => (
            <path key={line.period} d={line_path(line.values)} fill="none" stroke={line.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {selected && (
            <g pointerEvents="none">
              <line x1={selectedX} y1={PAD.top} x2={selectedX} y2={volumeTop + volumeH} stroke="#8b95a1" strokeWidth={1} strokeDasharray="5 5" />
              <line x1={PAD.left} y1={selectedY} x2={PAD.left + cW} y2={selectedY} stroke={selectedColor} strokeWidth={1} strokeDasharray="2 4" />
              <rect x={PAD.left + cW + 8} y={selectedY - 14} width={86} height={28} rx={4} fill={selectedColor} />
              <text x={PAD.left + cW + 51} y={selectedY + 5} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700}>
                {selected.close.toLocaleString()}
              </text>
              <rect x={selectedX - 40} y={H - 26} width={80} height={22} rx={4} fill="#111827" opacity={0.9} />
              <text x={selectedX} y={H - 11} textAnchor="middle" fontSize={11} fill="#fff">{selected.date}</text>
              <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx={8} fill="#fff" stroke="#d1d5db" filter="drop-shadow(0 8px 18px rgba(15,23,42,0.12))" />
              <text x={tooltipX + 12} y={tooltipY + 22} fontSize={12} fontWeight={800} fill="#111827">{selected.date}</text>
              {[
                ['시가', selected.open],
                ['고가', selected.high],
                ['저가', selected.low],
                ['종가', selected.close],
                ['거래량', selected.volume],
              ].map(([label, value], i) => (
                <g key={label}>
                  <text x={tooltipX + 12} y={tooltipY + 44 + i * 16} fontSize={11} fill="#8b95a1">{label}</text>
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
