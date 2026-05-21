import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Chip, { ChipRow } from '../components/common/Chip'
import { api_get_stocks, api_get_stock_latest_price, type Stock, type StockPriceDaily } from '../api/stocks'

type MarketFilter = '전체' | 'KOSPI' | 'KOSDAQ' | 'KONEX'

type ApiObject = Record<string, unknown>
type DisplayStock = Stock & {
  ticker: string
  companyName: string
  market?: string
  sector?: string
  currency: string
  status: 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
}

const as_object = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? value as ApiObject : {}

const get_array = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data
  const obj = as_object(data)
  const candidates = [obj.items, obj.data, obj.stocks, obj.content, obj.results, obj.list]
  return candidates.find(Array.isArray) as unknown[] ?? []
}

const get_text = (obj: ApiObject, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

const parse_num = (value: unknown) => {
  if (typeof value === 'string') {
    const normalized = value.replaceAll(',', '').replace('%', '').trim()
    const n = Number(normalized)
    return Number.isNaN(n) ? undefined : n
  }
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

const get_num = (obj: ApiObject, keys: string[]) => {
  for (const key of keys) {
    const n = parse_num(obj[key])
    if (n !== undefined) return n
  }
  return 0
}

const normalize_stock = (value: unknown): DisplayStock => {
  const obj = as_object(value)
  const sectorObj = as_object(obj.sector)
  const ticker = get_text(obj, ['ticker', 'stockCode', 'stock_code', 'code', 'symbol', 'shortCode'])
  const companyName = get_text(obj, ['companyName', 'stockName', 'stock_name', 'name', 'company_name'], ticker)
  const isActive = obj.isActive !== false && obj.active !== false
  const status = get_text(obj, ['status'], isActive ? 'ACTIVE' : 'SUSPENDED') as DisplayStock['status']
  return {
    ...(obj as Stock),
    stockId: Number(obj.stockId ?? obj.id ?? 0),
    ticker,
    companyName,
    market: get_text(obj, ['market', 'marketName', 'market_name']) || undefined,
    sector: get_text(obj, ['sectorName', 'sector_name', 'sector'], get_text(sectorObj, ['name', 'sectorName'])) || undefined,
    currency: get_text(obj, ['currency'], 'KRW'),
    status: ['ACTIVE', 'DELISTED', 'SUSPENDED'].includes(status) ? status : 'ACTIVE',
    isActive,
  }
}

const get_stock_list = (data: unknown) =>
  get_array(data).map(normalize_stock).filter((stock) => stock.ticker)

const unwrap_price = (data: unknown) => {
  const obj = as_object(data)
  return as_object(obj.data ?? obj.price ?? obj.latestPrice ?? obj.latest ?? data)
}

const get_price = (data?: StockPriceDaily) =>
  data ? get_num(unwrap_price(data), ['currentPrice', 'closePrice', 'price', 'close', 'tradePrice']) : 0

const get_rate = (data?: StockPriceDaily) =>
  data ? get_num(unwrap_price(data), [
    'changeRate',
    'change_rate',
    'rate',
    'changePercent',
    'change_percent',
    'fluctuationRate',
    'fluctuation_rate',
    'signedChangeRate',
    'signed_change_rate',
  ]) : undefined

const fmt_price = (v?: number) => (v && v > 0 ? `${v.toLocaleString()}원` : '-')
const fmt_rate = (v?: number) => {
  if (v === undefined || v === null) return '-'
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
}

const matches_keyword = (stock: DisplayStock, keyword: string) => {
  const q = keyword.trim().toLowerCase()
  if (!q) return true
  return [stock.ticker, stock.companyName, stock.market, stock.sector]
    .some((value) => value?.toLowerCase().includes(q))
}

export default function TradeStocksPage() {
  const navigate = useNavigate()
  const [allStocks, setAllStocks] = useState<DisplayStock[]>([])
  const [prices, setPrices] = useState<Record<string, StockPriceDaily>>({})
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [market, setMarket] = useState<MarketFilter>('전체')
  const LIMIT = 20

  const load = useCallback(() => {
    setLoading(true)
    api_get_stocks({
      keyword: keyword || undefined,
      market: market !== '전체' ? (market as 'KOSPI' | 'KOSDAQ' | 'KONEX') : undefined,
      status: 'ACTIVE',
    })
      .then(({ data }) => {
        const list = get_stock_list(data)
        if (keyword.trim() && list.length === 0) {
          return api_get_stocks({
            market: market !== '전체' ? (market as 'KOSPI' | 'KOSDAQ' | 'KONEX') : undefined,
            status: 'ACTIVE',
          }).then(({ data }) => {
            setAllStocks(get_stock_list(data).filter((stock) => matches_keyword(stock, keyword)))
            setPage(1)
          })
        }
        setAllStocks(list)
        setPage(1)
      })
      .catch(() => {
        if (!keyword.trim()) {
          setAllStocks([])
          return
        }
        return api_get_stocks({
          market: market !== '전체' ? (market as 'KOSPI' | 'KOSDAQ' | 'KONEX') : undefined,
          status: 'ACTIVE',
        })
          .then(({ data }) => setAllStocks(get_stock_list(data).filter((stock) => matches_keyword(stock, keyword))))
          .catch(() => setAllStocks([]))
      })
      .finally(() => setLoading(false))
  }, [keyword, market])

  useEffect(() => { load() }, [load])

  const handle_search = () => {
    setKeyword(searchInput)
  }

  const handle_clear = () => {
    setSearchInput('')
    setKeyword('')
  }

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handle_search()
  }

  const isSearchMode = keyword.trim() !== ''
  const total = allStocks.length
  const totalPages = Math.ceil(total / LIMIT)
  const stocks = useMemo(
    () => allStocks.slice((page - 1) * LIMIT, page * LIMIT),
    [allStocks, page],
  )

  useEffect(() => {
    if (stocks.length === 0) return
    setPrices({})
    Promise.allSettled(stocks.map((s) => api_get_stock_latest_price(s.ticker)))
      .then((results) => {
        const map: Record<string, StockPriceDaily> = {}
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value.data) {
            map[stocks[i].ticker] = unwrap_price(r.value.data) as unknown as StockPriceDaily
          }
        })
        setPrices(map)
      })
  }, [stocks])

  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/trade')}>모의투자</span>
        <span className="bc-sep">›</span>
        {isSearchMode ? (
          <>
            <span className="bc-link" onClick={handle_clear}>전체 종목</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">검색 결과</span>
          </>
        ) : (
          <span className="bc-current">전체 종목 둘러보기</span>
        )}
      </div>

      <div className="page-title">
        <div>
          <h1>{isSearchMode ? `"${keyword}" 검색 결과` : '전체 종목 둘러보기'}</h1>
          <div className="page-sub">
            {loading ? '불러오는 중...' : `${total.toLocaleString()}개 종목`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => navigate('/trade')}>← 모의투자로</Button>
          <Button>+ 매수 주문</Button>
        </div>
      </div>

      <Card style={{ marginBottom: 16, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="bi bi-search" style={{ fontSize: 16, color: 'var(--primary)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handle_key_down}
            placeholder="종목명, 종목코드를 입력하세요 (예: 삼성전자, 005930)"
            style={{ flex: 1, fontSize: 15, border: 'none', outline: 'none', color: 'var(--t1)', background: 'transparent' }}
          />
          {searchInput && (
            <button className="btn btn-sm btn-outline" onClick={handle_clear}>✕</button>
          )}
          <Button size="sm" onClick={handle_search}>검색</Button>
        </div>
      </Card>

      <div className="row" style={{ marginBottom: 16 }}>
        <ChipRow>
          {(['전체', 'KOSPI', 'KOSDAQ', 'KONEX'] as MarketFilter[]).map((f) => (
            <Chip key={f} active={market === f} onClick={() => { setMarket(f); setPage(1) }}>{f}</Chip>
          ))}
        </ChipRow>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>종목을 불러오는 중...</div>
        ) : stocks.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>
            {isSearchMode ? `"${keyword}"에 해당하는 종목이 없습니다.` : '종목이 없습니다.'}
          </div>
        ) : (
          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--primary-subtle)' }}>
                <th style={{ paddingLeft: 24 }}>종목</th>
                <th>시장</th>
                <th>섹터</th>
                <th>통화</th>
                <th>현재가</th>
                <th>등락률</th>
                <th>상태</th>
                <th style={{ paddingRight: 24 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const p = prices[s.ticker]
                const currentPrice = get_price(p)
                const changeRate = get_rate(p)
                const isUp = (changeRate ?? 0) > 0
                const isDown = (changeRate ?? 0) < 0
                return (
                  <tr key={s.ticker} onClick={() => navigate(`/trade/stocks/${s.ticker}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ paddingLeft: 24 }}>
                      <div className="stock-cell">
                        <div className="logo-sm" style={{ fontSize: 11 }}>
                          {s.companyName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="strong">{s.companyName}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{s.ticker}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>{s.market ?? '-'}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{s.sector ?? '-'}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{s.currency}</td>
                    <td style={{ fontWeight: 700, fontSize: 14 }}>
                      {fmt_price(currentPrice)}
                    </td>
                    <td style={{
                      fontWeight: 700, fontSize: 13,
                      color: isUp ? 'var(--up)' : isDown ? 'var(--down)' : 'var(--t2)',
                    }}>
                      {fmt_rate(changeRate)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                        background: s.status === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(107,101,128,0.12)',
                        color: s.status === 'ACTIVE' ? 'var(--success)' : 'var(--t3)',
                      }}>
                        {s.status === 'ACTIVE' ? '거래가능' : s.status === 'SUSPENDED' ? '거래정지' : '상장폐지'}
                      </span>
                    </td>
                    <td style={{ paddingRight: 24 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-ghost">★</button>
                        <button className="btn btn-sm btn-up" disabled={s.status !== 'ACTIVE'}
                          onClick={(e) => { e.stopPropagation(); navigate(`/trade/stocks/${s.ticker}`) }}>매수</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {!loading && totalPages > 1 && (
          <div className="row" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total.toLocaleString()}개 종목
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← 이전</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return <Chip key={p} active={p === page} onClick={() => setPage(p)}>{p}</Chip>
              })}
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>다음 →</Button>
            </div>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
