import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from './AdminLayout'
import { api_get_stocks, type Stock } from '../../api/stocks'
import {
  api_admin_update_stock_status,
  api_admin_delete_stock,
  api_admin_sync_stocks,
  api_admin_sync_prices,
} from '../../api/admin'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '활성', color: 'var(--success)' },
  DELISTED: { label: '상장폐지', color: 'var(--t3)' },
  SUSPENDED: { label: '거래정지', color: 'var(--up)' },
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'DELISTED' | 'SUSPENDED'
type MarketFilter = 'ALL' | 'KOSPI' | 'KOSDAQ' | 'KONEX'

const get_stock_list = (data: Stock[] | { items?: Stock[] }) =>
  Array.isArray(data) ? data : data.items ?? []

const format_local_date = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const get_recent_year_range = () => {
  const end = new Date()
  end.setDate(end.getDate() - 1)

  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)

  return {
    startDate: format_local_date(start),
    endDate: format_local_date(end),
  }
}

export default function AdminStocksPage() {
  const [allStocks, setAllStocks] = useState<Stock[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [syncMsg, setSyncMsg] = useState('')
  const [syncLoading, setSyncLoading] = useState<'stocks' | 'prices' | 'priceHistory' | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const LIMIT = 20

  const load = useCallback(() => {
    setLoading(true)
    api_get_stocks({
      keyword: search || undefined,
      market: marketFilter !== 'ALL' ? (marketFilter as 'KOSPI' | 'KOSDAQ' | 'KONEX') : undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as 'ACTIVE' | 'DELISTED' | 'SUSPENDED') : undefined,
    })
      .then(({ data }) => {
        setAllStocks(get_stock_list(data))
        setPage(1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, marketFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const handle_search = () => {
    setSearch(searchInput)
  }

  const handle_status_change = async (ticker: string, status: 'ACTIVE' | 'DELISTED' | 'SUSPENDED') => {
    setActionLoading(ticker)
    try {
      await api_admin_update_stock_status(ticker, status)
      load()
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const handle_delete = async (ticker: string) => {
    if (!confirm(`${ticker} 종목을 삭제 처리하시겠습니까?`)) return
    setActionLoading(ticker)
    try {
      await api_admin_delete_stock(ticker)
      load()
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const handle_sync_stocks = async () => {
    setSyncLoading('stocks')
    setSyncMsg('')
    try {
      await api_admin_sync_stocks()
      setSyncMsg('종목 기본정보 수집이 완료되었습니다.')
      load()
    } catch (err: any) {
      setSyncMsg(err?.response?.data?.message ?? '수집 중 오류가 발생했습니다.')
    } finally {
      setSyncLoading(null)
    }
  }

  const handle_sync_prices = async () => {
    setSyncLoading('prices')
    setSyncMsg('')
    try {
      const { data } = await api_admin_sync_prices()
      setSyncMsg(`최신 일별 시세 수집이 완료되었습니다. (${data.date ?? '최근 거래일'})`)
    } catch (err: any) {
      setSyncMsg(err?.response?.data?.message ?? '수집 중 오류가 발생했습니다.')
    } finally {
      setSyncLoading(null)
    }
  }

  const handle_sync_price_history = async () => {
    setSyncLoading('priceHistory')
    setSyncMsg('')
    try {
      const range = get_recent_year_range()
      const { data } = await api_admin_sync_prices(range)
      setSyncMsg(
        `최근 1년 일별 시세 수집 완료: ${data.syncedDays ?? 0}개 거래일 저장`,
      )
    } catch (err: any) {
      setSyncMsg(err?.response?.data?.message ?? '수집 중 오류가 발생했습니다.')
    } finally {
      setSyncLoading(null)
    }
  }

  const total = allStocks.length
  const totalPages = Math.ceil(total / LIMIT)
  const stocks = useMemo(
    () => allStocks.slice((page - 1) * LIMIT, page * LIMIT),
    [allStocks, page],
  )

  return (
    <AdminLayout title="종목 관리">
      <div style={{ maxWidth: 1200 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>종목 관리</h2>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>전체 {total.toLocaleString()}개 종목</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handle_sync_stocks}
              disabled={syncLoading !== null}
              style={{
                height: 40, padding: '0 16px', borderRadius: 10, border: 'none',
                background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: 13,
                cursor: syncLoading ? 'not-allowed' : 'pointer', opacity: syncLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <i className={`bi ${syncLoading === 'stocks' ? 'bi-arrow-repeat' : 'bi-cloud-download'}`} />
              {syncLoading === 'stocks' ? '수집 중...' : '종목 수집'}
            </button>
            <button
              onClick={handle_sync_prices}
              disabled={syncLoading !== null}
              style={{
                height: 40, padding: '0 16px', borderRadius: 10,
                border: '1px solid var(--border)', background: '#fff',
                color: 'var(--primary)', fontWeight: 600, fontSize: 13,
                cursor: syncLoading ? 'not-allowed' : 'pointer', opacity: syncLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <i className={`bi ${syncLoading === 'prices' ? 'bi-arrow-repeat' : 'bi-graph-up'}`} />
              {syncLoading === 'prices' ? '수집 중...' : '최신 시세 수집'}
            </button>
            <button
              onClick={handle_sync_price_history}
              disabled={syncLoading !== null}
              style={{
                height: 40, padding: '0 16px', borderRadius: 10,
                border: '1px solid var(--border)', background: '#fff',
                color: 'var(--primary)', fontWeight: 600, fontSize: 13,
                cursor: syncLoading ? 'not-allowed' : 'pointer', opacity: syncLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <i className={`bi ${syncLoading === 'priceHistory' ? 'bi-arrow-repeat' : 'bi-clock-history'}`} />
              {syncLoading === 'priceHistory' ? '수집 중...' : '최근 1년 시세 수집'}
            </button>
          </div>
        </div>

        {syncMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
            background: syncMsg.includes('완료') ? '#F0FDF4' : '#FEF2F2',
            color: syncMsg.includes('완료') ? 'var(--success)' : 'var(--up)',
            border: `1px solid ${syncMsg.includes('완료') ? '#BBF7D0' : '#FCA5A5'}`,
          }}>
            {syncMsg}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10,
            padding: '0 14px', height: 40, flex: 1, minWidth: 200,
          }}>
            <i className="bi bi-search" style={{ color: 'var(--t3)', fontSize: 14 }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle_search()}
              placeholder="종목명 또는 종목코드 검색"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: 'var(--t1)', background: 'transparent', flex: 1 }}
            />
            <button
              onClick={handle_search}
              style={{ height: 28, padding: '0 12px', borderRadius: 7, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              검색
            </button>
          </div>

          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value as MarketFilter)}
            style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--t1)', background: '#fff', cursor: 'pointer' }}
          >
            <option value="ALL">전체 시장</option>
            <option value="KOSPI">KOSPI</option>
            <option value="KOSDAQ">KOSDAQ</option>
            <option value="KONEX">KONEX</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--t1)', background: '#fff', cursor: 'pointer' }}
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="SUSPENDED">거래정지</option>
            <option value="DELISTED">상장폐지</option>
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>불러오는 중...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--primary-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {['티커', '종목명', '시장', '섹터', '통화', '상태', '액션'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const statusInfo = STATUS_LABELS[stock.status] ?? STATUS_LABELS.ACTIVE
                  const isActing = actionLoading === stock.ticker
                  return (
                    <tr key={stock.ticker} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{stock.ticker}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{stock.companyName}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--t2)' }}>{stock.market ?? '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--t2)' }}>{stock.sector ?? '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--t2)' }}>{stock.currency}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                          background: `${statusInfo.color}18`, color: statusInfo.color,
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select
                            value={stock.status}
                            disabled={isActing}
                            onChange={(e) => handle_status_change(stock.ticker, e.target.value as 'ACTIVE' | 'DELISTED' | 'SUSPENDED')}
                            style={{
                              height: 30, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)',
                              fontSize: 12, color: 'var(--t1)', background: '#fff', cursor: 'pointer',
                              opacity: isActing ? 0.5 : 1,
                            }}
                          >
                            <option value="ACTIVE">활성</option>
                            <option value="SUSPENDED">거래정지</option>
                            <option value="DELISTED">상장폐지</option>
                          </select>
                          <button
                            onClick={() => handle_delete(stock.ticker)}
                            disabled={isActing}
                            style={{
                              height: 30, padding: '0 10px', borderRadius: 8, fontSize: 12,
                              border: '1px solid #FCA5A5', background: '#FEF2F2',
                              cursor: isActing ? 'not-allowed' : 'pointer', color: 'var(--up)', fontWeight: 500,
                              opacity: isActing ? 0.5 : 1,
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {!loading && stocks.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>조회 결과가 없습니다.</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                {(page - 1) * LIMIT + 1} - {Math.min(page * LIMIT, total)} / {total.toLocaleString()}개
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}
                >
                  ← 이전
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        height: 32, width: 32, borderRadius: 8, border: '1px solid var(--border)',
                        background: p === page ? 'var(--primary)' : '#fff',
                        color: p === page ? '#fff' : 'var(--t1)', cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400,
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}
                >
                  다음 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
