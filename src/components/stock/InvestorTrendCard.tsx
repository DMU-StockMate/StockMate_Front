import type { InvestorTrendDay } from '../../api/stocks'

interface InvestorTrendCardProps {
  days: InvestorTrendDay[]
  loading: boolean
}

const fmt_signed_amount = (won: number) => {
  const sign = won > 0 ? '+' : won < 0 ? '-' : ''
  const abs = Math.abs(won)
  const text = abs >= 100000000
    ? `${(abs / 100000000).toFixed(1)}억`
    : abs >= 10000
      ? `${Math.round(abs / 10000).toLocaleString()}만`
      : abs.toLocaleString()
  return `${sign}${text}`
}

const ROWS = [
  { key: 'individualNet', label: '개인' },
  { key: 'foreignNet', label: '외국인' },
  { key: 'institutionNet', label: '기관' },
] as const

function DivergingBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const pct = maxAbs > 0 ? Math.min(100, (Math.abs(value) / maxAbs) * 100) : 0
  const color = value >= 0 ? 'var(--up)' : 'var(--down)'

  return (
    <div style={{ display: 'flex', flex: 1, height: 10 }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {value < 0 && <div style={{ width: `${pct}%`, background: color, borderRadius: '4px 0 0 4px' }} />}
      </div>
      <div style={{ width: 1, background: 'var(--border)' }} />
      <div style={{ flex: 1 }}>
        {value >= 0 && <div style={{ width: `${pct}%`, background: color, borderRadius: '0 4px 4px 0' }} />}
      </div>
    </div>
  )
}

export default function InvestorTrendCard({ days, loading }: InvestorTrendCardProps) {
  if (loading) {
    return <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>투자자 동향을 불러오는 중...</div>
  }

  if (days.length === 0) {
    return <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>투자자 동향 데이터가 없습니다</div>
  }

  const latest = days[days.length - 1]
  const maxAbs = Math.max(
    Math.abs(latest.individualNet),
    Math.abs(latest.foreignNet),
    Math.abs(latest.institutionNet),
    1,
  )
  const recentDays = days.slice(-10).reverse()

  return (
    <div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        {latest.date.slice(0, 4)}.{latest.date.slice(4, 6)}.{latest.date.slice(6, 8)} 기준 순매수
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {ROWS.map(({ key, label }) => {
          const value = latest[key]
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, fontSize: 13, color: 'var(--t2)', flexShrink: 0 }}>{label}</div>
              <DivergingBar value={value} maxAbs={maxAbs} />
              <div
                style={{
                  width: 64, textAlign: 'right', fontSize: 13, fontWeight: 700, flexShrink: 0,
                  color: value >= 0 ? 'var(--up)' : 'var(--down)',
                }}
              >
                {fmt_signed_amount(value)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>최근 10거래일</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ width: '100%', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--primary-subtle)' }}>
              <th>날짜</th>
              <th style={{ textAlign: 'right' }}>개인</th>
              <th style={{ textAlign: 'right' }}>외국인</th>
              <th style={{ textAlign: 'right' }}>기관</th>
            </tr>
          </thead>
          <tbody>
            {recentDays.map((day) => (
              <tr key={day.date}>
                <td className="muted">{day.date.slice(4, 6)}.{day.date.slice(6, 8)}</td>
                {ROWS.map(({ key }) => (
                  <td
                    key={key}
                    style={{ textAlign: 'right', fontWeight: 600, color: day[key] >= 0 ? 'var(--up)' : 'var(--down)' }}
                  >
                    {fmt_signed_amount(day[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
