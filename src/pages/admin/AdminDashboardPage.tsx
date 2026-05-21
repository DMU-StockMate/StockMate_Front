import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { api_admin_get_users, api_admin_sync_stocks, api_admin_sync_prices } from '../../api/admin'
import { api_get_stocks, type Stock } from '../../api/stocks'

interface Stats {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  totalStocks: number
  activeStocks: number
}

const get_stock_total = (data: Stock[] | { total?: number; items?: Stock[] }) =>
  Array.isArray(data) ? data.length : data.total ?? data.items?.length ?? 0

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncMsg, setSyncMsg] = useState('')
  const [syncLoading, setSyncLoading] = useState<'stocks' | 'prices' | 'priceHistory' | null>(null)

  useEffect(() => {
    Promise.all([
      api_admin_get_users(),
      api_get_stocks({ limit: 1 }),
    ])
      .then(([usersRes, stocksRes]) => {
        const users = usersRes.data
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
          bannedUsers: users.filter((u) => u.status === 'BANNED').length,
          totalStocks: get_stock_total(stocksRes.data),
          activeStocks: 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handle_sync_stocks = async () => {
    setSyncLoading('stocks')
    setSyncMsg('')
    try {
      await api_admin_sync_stocks()
      setSyncMsg('종목 기본정보 수집이 완료되었습니다.')
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

  const STAT_CARDS = stats
    ? [
        { label: '전체 회원', value: stats.totalUsers, icon: 'bi-people', color: 'var(--primary)' },
        { label: '활성 회원', value: stats.activeUsers, icon: 'bi-person-check', color: 'var(--success)' },
        { label: '정지 회원', value: stats.bannedUsers, icon: 'bi-person-x', color: 'var(--up)' },
        { label: '전체 종목', value: stats.totalStocks, icon: 'bi-bar-chart', color: 'var(--warning)' },
      ]
    : []

  return (
    <AdminLayout title="대시보드">
      <div style={{ maxWidth: 1100 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>관리자 대시보드</h2>

        {loading ? (
          <div style={{ color: 'var(--t2)', padding: 40, textAlign: 'center' }}>불러오는 중...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {STAT_CARDS.map((s) => (
                <div key={s.label} style={{
                  background: '#fff', borderRadius: 16, padding: '20px 24px',
                  boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${s.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`bi ${s.icon}`} style={{ fontSize: 16, color: s.color }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--t1)' }}>{s.value.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* KRX Sync */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: 24,
              boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>KRX 데이터 수집</h3>
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
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handle_sync_stocks}
                  disabled={syncLoading !== null}
                  style={{
                    height: 44, padding: '0 20px', borderRadius: 10,
                    background: 'var(--primary)', color: '#fff',
                    border: 'none', cursor: syncLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 14, opacity: syncLoading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <i className={`bi ${syncLoading === 'stocks' ? 'bi-arrow-repeat' : 'bi-cloud-download'}`} />
                  {syncLoading === 'stocks' ? '수집 중...' : '종목 기본정보 수집'}
                </button>
                <button
                  onClick={handle_sync_prices}
                  disabled={syncLoading !== null}
                  style={{
                    height: 44, padding: '0 20px', borderRadius: 10,
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    border: '1px solid var(--border)', cursor: syncLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 14, opacity: syncLoading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <i className={`bi ${syncLoading === 'prices' ? 'bi-arrow-repeat' : 'bi-graph-up'}`} />
                  {syncLoading === 'prices' ? '수집 중...' : '최신 시세 수집'}
                </button>
                <button
                  onClick={handle_sync_price_history}
                  disabled={syncLoading !== null}
                  style={{
                    height: 44, padding: '0 20px', borderRadius: 10,
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    border: '1px solid var(--border)', cursor: syncLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: 14, opacity: syncLoading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <i className={`bi ${syncLoading === 'priceHistory' ? 'bi-arrow-repeat' : 'bi-clock-history'}`} />
                  {syncLoading === 'priceHistory' ? '수집 중...' : '최근 1년 시세 수집'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 12 }}>
                날짜를 지정하지 않으면 오늘 날짜 기준으로 수집합니다.
              </p>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
