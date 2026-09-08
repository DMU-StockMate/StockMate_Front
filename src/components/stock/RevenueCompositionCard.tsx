import type { RevenueCompositionItem } from '../../api/stocks'

interface RevenueCompositionCardProps {
  items: RevenueCompositionItem[]
  period: string | null
  loading: boolean
}

const COLORS = ['#7C3AED', '#2563EB', '#059669', '#F97316', '#DB2777', '#9CA3AF']

const SIZE = 160
const RADIUS = 62
const STROKE = 28
const CIRC = 2 * Math.PI * RADIUS

export default function RevenueCompositionCard({ items, period, loading }: RevenueCompositionCardProps) {
  if (loading) {
    return <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>매출구성을 불러오는 중...</div>
  }

  const positiveTotal = items.reduce((sum, item) => sum + Math.max(item.ratio, 0), 0)

  if (items.length === 0 || positiveTotal <= 0) {
    return <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>매출구성 데이터가 없습니다</div>
  }

  let offset = 0
  const segments = items
    .filter((item) => item.ratio > 0)
    .map((item, i) => {
      const fraction = item.ratio / positiveTotal
      const dash = fraction * CIRC
      const seg = { ...item, color: COLORS[i % COLORS.length], dash, offset }
      offset += dash
      return seg
    })

  return (
    <div>
      {period && <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>{period} 기준</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0 }}>
          <g transform={`translate(${SIZE / 2}, ${SIZE / 2}) rotate(-90)`}>
            <circle r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
            {segments.map((seg) => (
              <circle
                key={seg.name}
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
              />
            ))}
          </g>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
          {segments.map((seg) => (
            <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--t2)', flex: 1 }}>{seg.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{seg.ratio.toFixed(1)}%</span>
            </div>
          ))}
          {items.some((item) => item.ratio < 0) && (
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
              * 내부거래 조정 등으로 음수 항목은 차트에서 제외했습니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
