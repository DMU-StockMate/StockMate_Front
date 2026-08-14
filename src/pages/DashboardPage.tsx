import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import Progress from '../components/common/Progress'
import Chip, { ChipRow } from '../components/common/Chip'
import { format_rate } from '../hooks/useTradeHistory'
import {
  useDashboard,
  CHART_WIDTH_CONST,
  CHART_HEIGHT_CONST,
} from '../hooks/useDashboard'
import { useLearnPage } from '../hooks/useLearnPage'

const PERIOD_TABS = ['1주', '1개월', '3개월', '1년']

const format_chart_period = (period: string) =>
  period === '1년' ? '최근 1년' : `최근 ${period}`

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    period, setPeriod, chartLoading,
    recommendQuestions, recommendLoading,
    holdings, summary, loading, error, topHoldings,
    chartPoints, chartFill, lastChartPoint,
    format_money,
  } = useDashboard()
  const { stats, questionCount, accuracy, streakDays, loading: learnLoading } = useLearnPage()

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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card variant="hero" className="card-lg">
          <div className="label">총 가상 자산</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>
            {loading ? '불러오는 중' : format_money(summary.totalAsset)}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>평가 손익</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                {loading ? '-' : `${summary.totalProfit >= 0 ? '+' : ''}${format_money(summary.totalProfit)}`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>총 수익률</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                {loading ? '-' : format_rate(summary.totalProfitRate)}
              </div>
            </div>
            <Pill variant="outline-light" style={{ cursor: 'pointer' }} onClick={() => navigate('/trade')}>
              모의투자 ›
            </Pill>
          </div>
          <div style={{ opacity: 0.85, fontSize: 12, marginTop: 12 }}>
            예수금 {format_money(summary.cashBalance)} · 보유 평가 {format_money(summary.stockValue)}
          </div>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill>{user?.level ?? '초급 Lv.1'}</Pill>
            <span className="muted" style={{ fontSize: 12 }}>오늘의 학습</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {learnLoading ? '불러오는 중' : `${stats?.correct ?? 0}문제 정답 · 정답률 ${accuracy}%`}
          </div>
          <div className="muted" style={{ marginTop: 4 }}>정답 시 자금 +500원/문제</div>
          <Progress value={stats?.total ?? 0} max={Math.max(questionCount, 1)} style={{ marginTop: 16 }} />
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>{stats?.total ?? 0} / {questionCount} 완료</span>
            <Button size="sm">
              <i className="bi bi-play-fill" />
              학습 시작
            </Button>
          </div>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill variant="accent">이번 주 미션</Pill>
            <span className="muted" style={{ fontSize: 12 }}>{Math.min(streakDays, 7)} / 7</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>7일 연속 학습</div>
          <div className="muted" style={{ marginTop: 4 }}>달성 시 +5,000원 보너스</div>
          <div className="mission-gauge" style={{ marginTop: 18 }}>
            {Array.from({ length: 7 }, (_, i) => i < streakDays).map((fill, i) => (
              <span key={i} className={fill ? 'fill' : ''} />
            ))}
          </div>
          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            {streakDays > 0 ? `${streakDays}일 연속 학습 중` : '오늘 학습을 시작해보세요'}
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row" style={{ marginBottom: 16 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>자산 추이</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {format_chart_period(period)} 평가금액 변화
            </div>
          </div>
          <ChipRow>
            {PERIOD_TABS.map((t) => (
              <Chip key={t} active={period === t} onClick={() => setPeriod(t)}>{t}</Chip>
            ))}
          </ChipRow>
        </div>
        {error && (
          <div className="muted" style={{ marginBottom: 12, color: 'var(--up)' }}>{error}</div>
        )}
        <div style={{ height: 200 }}>
          {chartLoading || loading ? (
            <div className="muted" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              자산 추이를 불러오는 중입니다.
            </div>
          ) : chartPoints ? (
            <svg viewBox={`0 0 ${CHART_WIDTH_CONST} ${CHART_HEIGHT_CONST}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline fill="url(#chartGrad)" stroke="none" points={chartFill} />
              <polyline fill="none" stroke="#6D29D9" strokeWidth="2.5" points={chartPoints} />
              <circle cx={lastChartPoint[0]} cy={lastChartPoint[1]} r="5" fill="#6D29D9" stroke="#fff" strokeWidth="2.5" />
            </svg>
          ) : (
            <div className="muted" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              자산 추이를 표시할 데이터가 없습니다.
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <Card>
          <div className="row" style={{ marginBottom: 8 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>보유 종목</div>
            <span style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate('/trade/history')}>전체 보기 →</span>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>종목</th><th>보유</th><th>평균가</th><th>현재가</th><th>손익률</th><th></th></tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--t2)' }}>보유 종목을 불러오는 중입니다.</td>
                </tr>
              )}
              {!loading && topHoldings.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--t2)' }}>아직 보유 중인 종목이 없습니다.</td>
                </tr>
              )}
              {!loading && topHoldings.map((holding) => (
                <tr key={holding.holdingId} onClick={() => navigate(`/trade/stocks/${holding.ticker}`)}>
                  <td>
                    <div className="stock-cell">
                      <div className="stock-logo">{holding.companyName.slice(0, 2)}</div>
                      <div>
                        <div className="strong">{holding.companyName}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{holding.ticker}</div>
                      </div>
                    </div>
                  </td>
                  <td>{holding.quantity.toLocaleString()}주</td>
                  <td>{format_money(holding.averagePriceNum)}</td>
                  <td className="strong">{format_money(holding.currentPrice)}</td>
                  <td className={holding.profitRate >= 0 ? 'price-up' : 'price-down'}>{format_rate(holding.profitRate)}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/trade/stocks/${holding.ticker}`) }}
                    >
                      매도
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && holdings.length > topHoldings.length && (
            <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
              외 {holdings.length - topHoldings.length}개 종목은 투자 내역에서 확인할 수 있습니다.
            </div>
          )}
        </Card>

        <Card>
          <div className="section-title">추천 학습</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recommendLoading && (
              <div className="muted" style={{ fontSize: 13 }}>문제를 불러오는 중입니다.</div>
            )}
            {!recommendLoading && recommendQuestions.length === 0 && (
              <div className="muted" style={{ fontSize: 13 }}>추천할 문제가 없습니다.</div>
            )}
            {!recommendLoading && recommendQuestions.map((r) => (
              <div
                key={r.id}
                style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                onClick={() => navigate(`/learn/quiz/1/${r.id}`)}
              >
                <div className="row">
                  <Pill variant="gray">{r.tag}</Pill>
                  <Pill variant="success">+{r.reward.toLocaleString()}원</Pill>
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
