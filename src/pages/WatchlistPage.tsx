import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import WatchlistSearchPanel from '../components/watchlist/WatchlistSearchPanel'
import WatchlistSummaryCards from '../components/watchlist/WatchlistSummaryCards'
import WatchlistTable from '../components/watchlist/WatchlistTable'
import { useWatchlist } from '../hooks/useWatchlist'

type FilterKey = 'all' | 'up' | 'down'

export default function WatchlistPage() {
  const navigate = useNavigate()
  const watchlist = useWatchlist()
  const [filter, setFilter] = useState<FilterKey>('all')

  const filteredItems = useMemo(() => {
    if (filter === 'up') return watchlist.items.filter((item) => (item.changeRate ?? 0) > 0)
    if (filter === 'down') return watchlist.items.filter((item) => (item.changeRate ?? 0) < 0)
    return watchlist.items
  }, [filter, watchlist.items])

  return (
    <AppLayout topbarPlaceholder="관심 종목 검색" hasWishlist>
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/trade')}>모의투자</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">관심 종목</span>
      </div>

      <div className="page-title">
        <div>
          <h1>관심 종목</h1>
          <div className="page-sub">지켜볼 종목을 모아두고 가격 흐름을 빠르게 확인하세요</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => void watchlist.reload()}>
            <i className="bi bi-arrow-clockwise" />
            새로고침
          </Button>
          <Button onClick={() => navigate('/trade/stocks')}>
            <i className="bi bi-search" />
            전체 종목
          </Button>
        </div>
      </div>

      <WatchlistSummaryCards items={watchlist.items} totalValue={watchlist.totalValue} />

      {watchlist.error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            background: '#FEF2F2',
            color: 'var(--up)',
            border: '1px solid #FCA5A5',
          }}
        >
          {watchlist.error}
        </div>
      )}

      <WatchlistSearchPanel />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div>
            <div className="section-title" style={{ marginBottom: 2 }}>내 관심 종목</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {filteredItems.length.toLocaleString()}개 표시 중
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              ['all', '전체'],
              ['up', '상승'],
              ['down', '하락'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                className={`chip ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <WatchlistTable
          actionTicker={watchlist.actionTicker}
          items={filteredItems}
          loading={watchlist.loading}
          onRemove={(watchlistId) => void watchlist.remove(watchlistId)}
        />
      </Card>
    </AppLayout>
  )
}
