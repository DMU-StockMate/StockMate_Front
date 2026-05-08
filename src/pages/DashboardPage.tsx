import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import Progress from '../components/common/Progress'
import Chip, { ChipRow } from '../components/common/Chip'

const CHART_POINTS = '0,140 80,130 160,150 240,110 320,120 400,90 480,100 560,70 640,80 720,55 800,65 880,40 960,50 1040,30 1100,25'
const CHART_FILL = CHART_POINTS + ' 1100,200 0,200'
const PERIOD_TABS = ['1주', '1개월', '3개월', '1년']

const HOLDINGS = [
  { name: '삼성전자', code: '005930', abbr: '삼', shares: 3, avgPrice: '70,200원', curPrice: '72,400원', rate: '+3.13%', up: true },
  { name: '카카오', code: '035720', abbr: '카', shares: 2, avgPrice: '58,000원', curPrice: '55,000원', rate: '-5.17%', up: false },
  { name: 'SK하이닉스', code: '000660', abbr: 'SK', shares: 1, avgPrice: '185,500원', curPrice: '192,300원', rate: '+3.66%', up: true },
]

const RECOMMEND = [
  { tag: '기초 용어', reward: '+500원', question: 'PER이 의미하는 것은?' },
  { tag: '차트', reward: '+800원', question: '데드크로스 의미는?' },
  { tag: '재무제표', reward: '+1,000원', question: 'ROE가 높을수록 좋은가?' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('1개월')

  return (
    <AppLayout hasNotification hasWishlist>
      <div className="page-title">
        <div>
          <div className="display">안녕하세요, {user?.name ?? '사용자'}님</div>
          <div className="page-sub">오늘도 한 걸음씩 투자 감각을 키워볼까요?</div>
        </div>
        <Button variant="ghost">
          <i className="bi bi-play-fill" />
          학습 시작
        </Button>
      </div>

      {/* 상단 3열 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card variant="hero" className="card-lg">
          <div className="label">총 가상 자산</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>12,540,000원</div>
          <div className="row" style={{ marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>평가 손익</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>+540,000원</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>오늘 수익률</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>+1.84%</div>
            </div>
            <Pill variant="outline-light" style={{ cursor: 'pointer' }}>
              모의투자 ›
            </Pill>
          </div>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill>{user?.level ?? '초급 Lv.1'}</Pill>
            <span className="muted" style={{ fontSize: 12 }}>오늘의 학습</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>5문제 · 25분</div>
          <div className="muted" style={{ marginTop: 4 }}>정답 시 자금 +500원/문제</div>
          <Progress value={40} style={{ marginTop: 16 }} />
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>2 / 5 완료</span>
            <Button size="sm">
              <i className="bi bi-play-fill" />
              학습 시작
            </Button>
          </div>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill variant="accent">이번 주 미션</Pill>
            <span className="muted" style={{ fontSize: 12 }}>4 / 7</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>7일 연속 학습</div>
          <div className="muted" style={{ marginTop: 4 }}>달성 시 +5,000원 보너스</div>
          <div className="mission-gauge" style={{ marginTop: 18 }}>
            {[true, true, true, true, false, false, false].map((fill, i) => (
              <span key={i} className={fill ? 'fill' : ''} />
            ))}
          </div>
          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            다음 보상: +2,000원 (5일차)
          </div>
        </Card>
      </div>

      {/* 자산 추이 차트 */}
      <Card style={{ marginBottom: 20 }}>
        <div className="row" style={{ marginBottom: 16 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>자산 추이</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>최근 1개월 평가금액 변화</div>
          </div>
          <ChipRow>
            {PERIOD_TABS.map((t) => (
              <Chip key={t} active={period === t} onClick={() => setPeriod(t)}>
                {t}
              </Chip>
            ))}
          </ChipRow>
        </div>
        <div style={{ height: 200 }}>
          <svg viewBox="0 0 1100 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline fill="url(#chartGrad)" stroke="none" points={CHART_FILL} />
            <polyline fill="none" stroke="#6D29D9" strokeWidth="2.5" points={CHART_POINTS} />
            <circle cx="1100" cy="25" r="5" fill="#6D29D9" stroke="#fff" strokeWidth="2.5" />
          </svg>
        </div>
      </Card>

      {/* 보유 종목 + 추천 학습 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Card>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>보유 종목</div>
            <span style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)' }}>전체 보기 →</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>종목</th><th>보유</th><th>평균가</th><th>현재가</th><th>손익률</th><th></th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h) => (
                <tr key={h.code}>
                  <td>
                    <div className="stock-cell">
                      <div className="stock-logo">{h.abbr}</div>
                      <div>
                        <div className="strong">{h.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{h.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>{h.shares}주</td>
                  <td>{h.avgPrice}</td>
                  <td className="strong">{h.curPrice}</td>
                  <td className={h.up ? 'price-up' : 'price-down'}>{h.rate}</td>
                  <td><Button variant="ghost" size="sm">매도</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="section-title">추천 학습</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RECOMMEND.map((r) => (
              <div
                key={r.question}
                style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="row">
                  <Pill variant="gray">{r.tag}</Pill>
                  <Pill variant="success">{r.reward}</Pill>
                </div>
                <div className="strong" style={{ marginTop: 8, fontSize: 13 }}>{r.question}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
