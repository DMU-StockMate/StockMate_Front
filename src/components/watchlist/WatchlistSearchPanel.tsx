import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button'
import Card from '../common/Card'
import { api_get_stocks, type Stock } from '../../api/stocks'
import { useWatchlist } from '../../hooks/useWatchlist'

type ApiObject = Record<string, unknown>

const as_object = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {}

const get_array = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data
  const obj = as_object(data)
  const candidates = [obj.items, obj.data, obj.stocks, obj.content, obj.results, obj.list]
  return candidates.find(Array.isArray) as unknown[] ?? []
}

const pick_text = (obj: ApiObject, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

const normalize_stock = (value: unknown): Stock => {
  const obj = as_object(value)
  const ticker = pick_text(obj, ['ticker', 'stockCode', 'stock_code', 'code', 'symbol', 'shortCode'])
  const companyName = pick_text(obj, ['companyName', 'stockName', 'stock_name', 'name', 'company_name'], ticker)
  const isActive = obj.isActive !== false && obj.active !== false
  const rawStatus = pick_text(obj, ['status'], isActive ? 'ACTIVE' : 'SUSPENDED')
  return {
    ...(obj as Stock),
    stockId: Number(obj.stockId ?? obj.id ?? 0),
    ticker,
    companyName,
    market: pick_text(obj, ['market', 'marketName', 'market_name']) || undefined,
    sector: pick_text(obj, ['sectorName', 'sector_name', 'sector']) || undefined,
    currency: pick_text(obj, ['currency'], 'KRW'),
    status: ['ACTIVE', 'DELISTED', 'SUSPENDED'].includes(rawStatus) ? rawStatus as Stock['status'] : 'ACTIVE',
    isActive,
  }
}

interface WatchlistSearchPanelProps {
  onAdded?: () => void
}

export default function WatchlistSearchPanel({ onAdded }: WatchlistSearchPanelProps) {
  const navigate = useNavigate()
  const watchlist = useWatchlist()
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(() => {
    const q = keyword.trim()
    if (!q) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)
    api_get_stocks({ keyword: q, status: 'ACTIVE', limit: 8 })
      .then(({ data }) => {
        setResults(get_array(data).map(normalize_stock).filter((stock) => stock.ticker).slice(0, 8))
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [keyword])

  const handleToggle = async (stock: Stock) => {
    await watchlist.toggleStock(stock)
    onAdded?.()
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
          placeholder="관심 종목으로 추가할 종목명 또는 종목코드"
          style={{ flex: 1, fontSize: 15, border: 'none', outline: 'none', color: 'var(--t1)', background: 'transparent', minWidth: 0 }}
        />
        {keyword && (
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              setKeyword('')
              setResults([])
              setSearched(false)
            }}
          >
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
