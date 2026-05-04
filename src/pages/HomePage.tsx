import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { useState } from 'react'
import { authAtom } from '../store/authAtom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Pill from '../components/ui/Pill'
import Progress from '../components/ui/Progress'
import Chip, { ChipRow } from '../components/ui/Chip'

const CHART_POINTS = '0,140 80,130 160,150 240,110 320,120 400,90 480,100 560,70 640,80 720,55 800,65 880,40 960,50 1040,30 1100,25'
const CHART_FILL = CHART_POINTS + ' 1100,200 0,200'

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

const PERIOD_TABS = ['1주', '1개월', '3개월', '1년']

function GuestBanner() {
  return (
    <div
      style={{
        background: 'var(--gradient)',
        borderRadius: 20,
        padding: '36px 40px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(109,41,217,0.22)',
      }}
    >
      <div>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, letterSpacing: '0.4px', textTransform: 'uppercase', fontWeight: 600 }}>
          StockMate
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 10 }}>
          주식 투자, 지금 시작해보세요
        </div>
        <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          AI 분석 · 모의투자 · 단계별 학습으로<br />실전 투자 실력을 키워보세요
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            to="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 44,
              padding: '0 20px',
              borderRadius: 10,
              background: '#fff',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
          >
            <i className="bi bi-person-plus" />
            무료 회원가입
          </Link>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 44,
              padding: '0 20px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.16)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid rgba(255,255,255,0.28)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
          >
            <i className="bi bi-box-arrow-in-right" />
            로그인
          </Link>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 220 }}>
        {[
          { icon: 'bi-journal-check', label: '단계별 투자 학습', desc: '초급 · 중급 · 고급 커리큘럼' },
          { icon: 'bi-graph-up-arrow', label: '모의투자 시뮬레이션', desc: '실전과 동일한 환경' },
          { icon: 'bi-cpu', label: 'AI 종목 분석', desc: '데이터 기반 투자 인사이트' },
        ].map((f) => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <i className={`bi ${f.icon}`} style={{ fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { isLoggedIn, user } = useRecoilValue(authAtom)
  const [period, setPeriod] = useState('1개월')

  return (
    <AppLayout hasNotification hasWishlist>
      {!isLoggedIn && <GuestBanner />}

      {isLoggedIn && (
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
      )}

      {!isLoggedIn && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            { icon: 'bi-book-fill', title: '투자학습', desc: '78개 문제로 기초부터 고급까지', color: '#10B981' },
            { icon: 'bi-graph-up-arrow', title: '모의투자', desc: '가상 자금으로 실전 연습', color: 'var(--primary)' },
            { icon: 'bi-cpu', title: 'AI 분석', desc: '종목별 AI 인사이트 제공', color: 'var(--accent)' },
          ].map((item) => (
            <Card key={item.title} clickable>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <i className={`bi ${item.icon}`} style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
              <div className="muted">{item.desc}</div>
            </Card>
          ))}
        </div>
      )}

      {isLoggedIn && (
        <>
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
                <Pill variant="outline-light" style={{ cursor: 'pointer' }}>모의투자 ›</Pill>
              </div>
            </Card>

            <Card>
              <div className="row" style={{ marginBottom: 12 }}>
                <Pill>초급 Lv.2</Pill>
                <span className="muted" style={{ fontSize: 12 }}>오늘의 학습</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>5문제 · 25분</div>
              <div className="muted" style={{ marginTop: 4 }}>정답 시 자금 +500원/문제</div>
              <Progress value={40} />
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
                <span className="muted" style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)' }}>
                  전체 보기 →
                </span>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>종목</th>
                    <th>보유</th>
                    <th>평균가</th>
                    <th>현재가</th>
                    <th>손익률</th>
                    <th></th>
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
                      <td>
                        <Button variant="ghost" size="sm">매도</Button>
                      </td>
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
                    style={{
                      padding: 14,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
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
        </>
      )}
    </AppLayout>
  )
}
