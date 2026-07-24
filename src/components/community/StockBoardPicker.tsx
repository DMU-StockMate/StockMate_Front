import Card from '../common/Card'
import Button from '../common/Button'
import { useWatchlistSearch } from '../../hooks/useWatchlistSearch'

interface SelectedStock {
  ticker: string
  companyName: string
}

interface StockBoardPickerProps {
  selectedStock: SelectedStock | null
  onSelect: (stock: SelectedStock) => void
  onClear?: () => void
}

export default function StockBoardPicker({ selectedStock, onSelect, onClear }: StockBoardPickerProps) {
  const { keyword, setKeyword, results, loading, searched, search, handle_clear } = useWatchlistSearch()

  if (selectedStock && !searched) {
    return (
      <Card style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div className="row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-sm" style={{ fontSize: 11 }}>{selectedStock.companyName.slice(0, 2)}</div>
            <div>
              <div className="strong">{selectedStock.companyName}</div>
              <div className="muted" style={{ fontSize: 12 }}>{selectedStock.ticker}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {onClear && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                전체 종목 보기
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => search()}>
              종목 변경
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card style={{ padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <i className="bi bi-search" style={{ fontSize: 16, color: 'var(--primary)' }} />
        <input
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') search() }}
          placeholder="특정 종목 게시판만 보려면 종목명 또는 종목코드를 검색하세요 (선택)"
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
              {results.map((stock) => (
                <div
                  key={stock.ticker}
                  className="stock-cell"
                  style={{ cursor: 'pointer', padding: '8px 0' }}
                  onClick={() => { onSelect({ ticker: stock.ticker, companyName: stock.companyName }); handle_clear() }}
                >
                  <div className="logo-sm" style={{ fontSize: 11 }}>{stock.companyName.slice(0, 2)}</div>
                  <div>
                    <div className="strong">{stock.companyName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{stock.ticker} · {stock.market ?? '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
