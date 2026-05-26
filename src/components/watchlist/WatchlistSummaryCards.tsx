import Card from '../common/Card'
import { fmt_money, fmt_rate } from '../../hooks/useTradeStocks'
import type { WatchlistRow } from '../../hooks/useWatchlist'

interface WatchlistSummaryCardsProps {
  items: WatchlistRow[]
  totalValue: number
}

export default function WatchlistSummaryCards({ items, totalValue }: WatchlistSummaryCardsProps) {
  const upCount = items.filter((item) => (item.changeRate ?? 0) > 0).length
  const downCount = items.filter((item) => (item.changeRate ?? 0) < 0).length
  const avgRate = items.length > 0
    ? items.reduce((sum, item) => sum + (item.changeRate ?? 0), 0) / items.length
    : undefined

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
      <Card style={{ padding: '18px 20px' }}>
        <div className="label">관심 종목</div>
        <div className="strong" style={{ fontSize: 24, marginTop: 6 }}>{items.length.toLocaleString()}개</div>
      </Card>
      <Card style={{ padding: '18px 20px' }}>
        <div className="label">현재가 합계</div>
        <div className="strong" style={{ fontSize: 24, marginTop: 6 }}>{fmt_money(totalValue)}</div>
      </Card>
      <Card style={{ padding: '18px 20px' }}>
        <div className="label">평균 등락률</div>
        <div
          className="strong"
          style={{
            fontSize: 24,
            marginTop: 6,
            color: (avgRate ?? 0) > 0 ? 'var(--up)' : (avgRate ?? 0) < 0 ? 'var(--down)' : 'var(--t1)',
          }}
        >
          {avgRate === undefined ? '-' : fmt_rate(avgRate)}
        </div>
      </Card>
      <Card style={{ padding: '18px 20px' }}>
        <div className="label">상승 / 하락</div>
        <div className="strong" style={{ fontSize: 24, marginTop: 6 }}>
          <span style={{ color: 'var(--up)' }}>{upCount}</span>
          <span className="muted"> / </span>
          <span style={{ color: 'var(--down)' }}>{downCount}</span>
        </div>
      </Card>
    </div>
  )
}
