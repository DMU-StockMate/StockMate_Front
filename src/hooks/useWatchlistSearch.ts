import { useCallback, useState } from 'react'
import { api_get_stocks, type Stock } from '../api/stocks'
import { as_record, get_array } from '../utils/normalize'

const pick_text = (obj: Record<string, unknown>, keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

const normalize_stock = (value: unknown): Stock => {
  const obj = as_record(value)
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

export function useWatchlistSearch() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(() => {
    const q = keyword.trim()
    if (!q) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    api_get_stocks({ keyword: q, status: 'ACTIVE', limit: 8 })
      .then(({ data }) => setResults(get_array(data).map(normalize_stock).filter((s) => s.ticker).slice(0, 8)))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [keyword])

  const handle_clear = () => { setKeyword(''); setResults([]); setSearched(false) }

  return { keyword, setKeyword, results, loading, searched, search, handle_clear }
}
