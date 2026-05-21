import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import Progress from '../components/common/Progress'
import { api_logout } from '../api/auth'
import { api_get_statistics, type LearningStatistics } from '../api/learning'

const MENU = [
  { icon: 'bi-person-gear', label: '개인정보 변경' },
  { icon: 'bi-heart', label: '찜한 문제' },
  { icon: 'bi-clock-history', label: '모의투자 내역' },
  { icon: 'bi-bar-chart-fill', label: '투자 통계' },
  { icon: 'bi-gear', label: '설정' },
]

export default function MyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<LearningStatistics | null>(null)

  useEffect(() => {
    api_get_statistics()
      .then(({ data }) => setStats(data))
      .catch(() => {})
  }, [])

  const handle_logout = async () => {
    try {
      await api_logout()
    } catch {
      // 서버 에러와 관계없이 로컬 상태 정리
    }
    logout()
    navigate('/login')
  }

  return (
    <AppLayout topbarPlaceholder="검색">
      <div className="page-title">
        <div>
          <h1>마이페이지</h1>
          <div className="page-sub">계정과 활동을 관리하세요</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <div className="row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div className="avatar" style={{ width: 80, height: 80 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{user?.name ?? '사용자'}</div>
                <div className="muted" style={{ marginTop: 4 }}>{user?.email ?? '-'}</div>
                {user?.nickname && (
                  <div className="muted" style={{ marginTop: 2, fontSize: 12 }}>@{user.nickname}</div>
                )}
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <Pill>{user?.level ?? '초급 Lv.1'}</Pill>
                  <Pill variant="accent">7일 연속 학습 중</Pill>
                </div>
              </div>
            </div>
            <Button variant="outline">
              <i className="bi bi-pencil" />
              프로필 편집
            </Button>
          </div>
        </Card>

        <Card variant="hero">
          <div className="label">현재 등급</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{user?.level ?? '초급 Lv.1'}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
            {stats ? `다음 등급까지 ${Math.max(0, 50 - stats.correct)}문제` : '다음 등급까지 -'}
          </div>
          <Progress value={stats ? Math.min(100, stats.correct * 2) : 0} variant="hero" style={{ marginTop: 14 }} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { num: '+4.5%', lbl: '총 수익률', cls: 'price-up' },
          { num: '12', lbl: '거래 횟수', cls: '' },
          {
            num: stats ? String(stats.total) : '-',
            lbl: '푼 문제',
            cls: '',
          },
        ].map((s) => (
          <Card key={s.lbl} style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }} className={s.cls}>{s.num}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>{s.lbl}</div>
          </Card>
        ))}
      </div>

      {stats && (
        <Card style={{ marginBottom: 20 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>학습 통계</div>
            <span className="muted" style={{ fontSize: 12 }}>정답률 {stats.accuracy}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { num: stats.total, lbl: '총 문제 수' },
              { num: stats.correct, lbl: '정답', cls: 'price-up' },
              { num: stats.wrong, lbl: '오답', cls: 'price-down' },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }} className={s.cls}>{s.num}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="menu-list">
        {MENU.map((item) => (
          <div key={item.label} className="menu-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className={`bi ${item.icon}`} style={{ fontSize: 16, color: 'var(--t2)' }} />
              {item.label}
            </div>
            <i className="bi bi-chevron-right" style={{ color: 'var(--t3)' }} />
          </div>
        ))}
        <div className="menu-row" style={{ color: 'var(--up)' }} onClick={handle_logout}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-box-arrow-right" style={{ fontSize: 16 }} />
            로그아웃
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
