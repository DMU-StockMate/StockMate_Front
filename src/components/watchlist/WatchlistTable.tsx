import { useNavigate } from 'react-router-dom'
import Button from '../common/Button'
import { fmt_price, fmt_rate } from '../../hooks/useTradeStocks'
import type { WatchlistRow } from '../../hooks/useWatchlist'

interface WatchlistTableProps {
  actionTicker: string | null
  items: WatchlistRow[]
  loading: boolean
  onRemove: (watchlistId: string) => void
}

export default function WatchlistTable({ actionTicker, items, loading, onRemove }: WatchlistTableProps) {
  const navigate = useNavigate()

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>관심 종목을 불러오는 중...</div>
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>
        아직 등록한 관심 종목이 없습니다.
      </div>
    )
  }

  return (
    <table className="tbl" style={{ width: '100%' }}>
      <thead>
        <tr style={{ background: 'var(--primary-subtle)' }}>
          <th style={{ paddingLeft: 24 }}>종목</th>
          <th>시장</th>
          <th>섹터</th>
          <th>현재가</th>
          <th>등락률</th>
          <th>등록일</th>
          <th style={{ paddingRight: 24 }}>액션</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isUp = (item.changeRate ?? 0) > 0
          const isDown = (item.changeRate ?? 0) < 0
          return (
            <tr key={item.watchlistId} onClick={() => navigate(`/trade/stocks/${item.ticker}`)} style={{ cursor: 'pointer' }}>
              <td style={{ paddingLeft: 24 }}>
                <div className="stock-cell">
                  <div className="logo-sm" style={{ fontSize: 11 }}>{item.companyName.slice(0, 2)}</div>
                  <div>
                    <div className="strong">{item.companyName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{item.ticker}</div>
                  </div>
                </div>
              </td>
              <td className="muted" style={{ fontSize: 13 }}>{item.market ?? '-'}</td>
              <td className="muted" style={{ fontSize: 13 }}>{item.sector ?? '-'}</td>
              <td style={{ fontWeight: 700, fontSize: 14 }}>{fmt_price(item.currentPrice)}</td>
              <td style={{
                fontWeight: 700,
                fontSize: 13,
                color: isUp ? 'var(--up)' : isDown ? 'var(--down)' : 'var(--t2)',
              }}>
                {fmt_rate(item.changeRate)}
              </td>
              <td className="muted" style={{ fontSize: 13 }}>
                {item.createdAt ? item.createdAt.slice(0, 10) : '-'}
              </td>
              <td style={{ paddingRight: 24 }} onClick={(event) => event.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={actionTicker === item.ticker}
                  onClick={() => onRemove(item.watchlistId)}
                >
                  <i className="bi bi-star-fill" />
                  삭제
                </Button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
