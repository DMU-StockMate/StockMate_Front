import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import {
  api_get_asset_rankings,
  api_get_weekly_growth_rankings,
  type RankingUser,
} from '../api/trading'
import { fmt_price, fmt_rate, to_num } from '../utils/format'

type RankingTab = 'assets' | 'growth'

const tabs: Array<{ key: RankingTab; label: string; icon: string }> = [
  { key: 'assets', label: '자산 랭킹', icon: 'bi-wallet2' },
  { key: 'growth', label: '주간 상승', icon: 'bi-graph-up-arrow' },
]

const medal_class = (rank: number) =>
  rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''

function RankRow({ user, tab }: { user: RankingUser; tab: RankingTab }) {
  const amount = tab === 'growth' ? user.growthAmount : user.totalAssetValue
  const sub = tab === 'growth'
    ? `총 자산 ${fmt_price(user.totalAssetValue)}`
    : `시드머니 ${fmt_price(user.seedMoney)}`

  return (
    <tr>
      <td>
        <span className={`rank-badge ${medal_class(user.rank)}`}>{user.rank}</span>
      </td>
      <td>
        <div className="stock-cell">
          {user.profileImageUrl ? (
            <img className="ranking-avatar" src={user.profileImageUrl} alt="" />
          ) : (
            <div className="ranking-avatar">{user.nickname.slice(0, 2)}</div>
          )}
          <div>
            <div className="strong">{user.nickname}</div>
            <div className="muted" style={{ fontSize: 12 }}>{sub}</div>
          </div>
        </div>
      </td>
      <td className="strong">{fmt_price(amount)}</td>
      <td className={to_num(user.growthRate) >= 0 ? 'price-up' : 'price-down'}>
        {tab === 'growth' ? fmt_rate(user.growthRate) : fmt_price(user.cashBalance)}
      </td>
    </tr>
  )
}

export default function RankingPage() {
  const [tab, setTab] = useState<RankingTab>('assets')
  const [assetRanks, setAssetRanks] = useState<RankingUser[]>([])
  const [growthRanks, setGrowthRanks] = useState<RankingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      api_get_asset_rankings({ limit: 30 }),
      api_get_weekly_growth_rankings({ limit: 30 }),
    ])
      .then(([assetRes, growthRes]) => {
        setAssetRanks(assetRes.data)
        setGrowthRanks(growthRes.data)
      })
      .catch(() => setError('랭킹을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'))
      .finally(() => setLoading(false))
  }, [])

  const ranks = tab === 'assets' ? assetRanks : growthRanks
  const top3 = ranks.slice(0, 3)
  const leader = ranks[0]
  const summary = useMemo(() => {
    const total = ranks.reduce((sum, user) => sum + to_num(user.totalAssetValue), 0)
    return {
      count: ranks.length,
      average: ranks.length ? total / ranks.length : 0,
    }
  }, [ranks])

  return (
    <AppLayout topbarPlaceholder="검색">
      <div className="page-title">
        <div>
          <h1>랭킹전</h1>
          <div className="page-sub">가상 투자 자산과 최근 7일 상승 성과를 비교해보세요</div>
        </div>
        <div className="ranking-tabs" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? 'active' : ''}
              onClick={() => setTab(item.key)}
            >
              <i className={`bi ${item.icon}`} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="ranking-alert">
          <i className="bi bi-exclamation-circle" />
          {error}
        </div>
      )}

      <div className="ranking-summary-grid">
        <Card variant="hero" className="ranking-hero">
          <div className="label">{tab === 'assets' ? '현재 1위 자산' : '이번 주 1위 상승액'}</div>
          <div className="ranking-hero-value">
            {loading ? '불러오는 중' : fmt_price(tab === 'assets' ? leader?.totalAssetValue : leader?.growthAmount)}
          </div>
          <div className="ranking-hero-meta">
            {leader ? `${leader.nickname} · ${tab === 'growth' ? fmt_rate(leader.growthRate) : '자산 선두'}` : '랭킹 데이터 없음'}
          </div>
        </Card>

        <Card>
          <div className="metric">
            <div className="lbl">참여자</div>
            <div className="val">{loading ? '-' : `${summary.count.toLocaleString()}명`}</div>
          </div>
        </Card>

        <Card>
          <div className="metric">
            <div className="lbl">평균 자산</div>
            <div className="val">{loading ? '-' : fmt_price(summary.average)}</div>
          </div>
        </Card>
      </div>

      <div className="ranking-podium">
        {loading ? (
          <Card><div className="ranking-empty">랭킹을 불러오는 중입니다.</div></Card>
        ) : top3.length === 0 ? (
          <Card><div className="ranking-empty">아직 랭킹 데이터가 없습니다.</div></Card>
        ) : top3.map((user) => (
          <Card key={user.userId} className={`podium-card rank-${user.rank}`}>
            <span className={`rank-badge ${medal_class(user.rank)}`}>{user.rank}</span>
            <div className="ranking-avatar large">{user.nickname.slice(0, 2)}</div>
            <div className="strong" style={{ fontSize: 16 }}>{user.nickname}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {tab === 'growth' ? fmt_rate(user.growthRate) : '총 자산'}
            </div>
            <div className="podium-value">
              {fmt_price(tab === 'growth' ? user.growthAmount : user.totalAssetValue)}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="row" style={{ marginBottom: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>
              {tab === 'assets' ? '자산 순위' : '최근 일주일 상승 순위'}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {tab === 'assets' ? '총 평가 자산 기준' : '최근 7일 안에 갱신된 계좌 기준'}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise" />
            새로고침
          </Button>
        </div>

        <table className="tbl ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>사용자</th>
              <th>{tab === 'assets' ? '총 자산' : '상승액'}</th>
              <th>{tab === 'assets' ? '예수금' : '수익률'}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="ranking-empty">랭킹을 불러오는 중입니다.</td></tr>
            )}
            {!loading && ranks.length === 0 && (
              <tr><td colSpan={4} className="ranking-empty">표시할 랭킹이 없습니다.</td></tr>
            )}
            {!loading && ranks.map((user) => (
              <RankRow key={user.userId} user={user} tab={tab} />
            ))}
          </tbody>
        </table>
      </Card>
    </AppLayout>
  )
}
