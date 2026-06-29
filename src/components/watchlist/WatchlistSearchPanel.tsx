import { useNavigate } from 'react-router-dom'
import Button from '../common/Button'
import Card from '../common/Card'
import { useWatchlist } from '../../hooks/useWatchlist'
import { useWatchlistSearch } from '../../hooks/useWatchlistSearch'

interface WatchlistSearchPanelProps {
  onAdded?: () => void
}

export default function WatchlistSearchPanel({ onAdded }: WatchlistSearchPanelProps) {
  const navigate = useNavigate()
  const watchlist = useWatchlist()
  const { keyword, setKeyword, results, loading, searched, search, handle_clear } = useWatchlistSearch()

  const handleToggle = async (stock: { ticker: string; companyName: string; [key: string]: unknown }) => {
    await watchlist.toggleStock(stock as Parameters<typeof watchlist.toggleStock>[0])
    onAdded?.()
  }

  return (
    <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <i className="bi bi-search" style={{ fontSize: 16, color: 'var(--primary)' }} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search() }}
          placeholder="관심 종목으로 추가할 종목명 또는 종목코드"
          style={{ flex: 1, fontSize: 15, border: 'none', outline: 'none', color: 'var(--t1)', background: 'transparent', minWidth: 0 }}
        />
        {keyword && (
          <button className="btn btn-sm btn-outline" onClick={handle_clear}>
            <i className="bi bi-x-lg" />
          </button>
        )}
        <Button size="sm" onClick={search} disabled={loading}>{loading ? '검색 중' : '검색'}</Button>
      </div>

      {searched && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--t2)' }}>종목을 찾는 중...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>검색 결과가 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {results.map((stock) => {
                const active = watchlist.isInWatchlist(stock.ticker)
                return (
                  <div key={stock.ticker} className="row" style={{ padding: '10px 0' }}>
                    <div className="stock-cell" onClick={() => navigate(`/trade/stocks/${stock.ticker}`)} style={{ cursor: 'pointer', minWidth: 0 }}>
                      <div className="logo-sm" style={{ fontSize: 11 }}>{stock.companyName.slice(0, 2)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="strong">{stock.companyName}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{stock.ticker} · {stock.market ?? '-'}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={active ? 'ghost' : 'outline'}
                      disabled={watchlist.actionTicker === stock.ticker}
                      onClick={() => void handleToggle(stock)}
                    >
                      <i className={`bi ${active ? 'bi-star-fill' : 'bi-star'}`} />
                      {active ? '등록됨' : '추가'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
