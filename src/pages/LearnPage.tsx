import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import Progress from '../components/common/Progress'

const LEVELS = [
  {
    id: 'beginner',
    badge: '초',
    badgeBg: '#10B981',
    className: 'beginner',
    title: '초급 학습',
    desc: '투자가 처음이라면 여기서 시작.\n기초 용어와 시장 구조부터.',
    tags: ['기초 용어', '차트 기초', '시장 이해', '+3'],
    count: '78문제 · 권장 Lv.1~3',
    progressPct: 64,
    progressText: '진행 64%',
    progressColor: 'var(--success)',
    recommended: true,
    locked: false,
  },
  {
    id: 'intermediate',
    badge: '중',
    badgeBg: '#3B82F6',
    className: 'intermediate',
    title: '중급 학습',
    desc: '핵심 지표 분석과 실전.\n가치평가, 산업 분석까지.',
    tags: ['재무제표', '가치평가', '산업 분석', '+4'],
    count: '156문제 · 권장 Lv.4~7',
    progressPct: 12,
    progressText: '진행 12%',
    progressColor: 'var(--down)',
    recommended: false,
    locked: false,
  },
  {
    id: 'advanced',
    badge: '고',
    badgeBg: '#6D29D9',
    className: 'advanced',
    title: '고급 학습',
    desc: '심화된 전략과 분석.\n거시경제, 옵션, 포트폴리오.',
    tags: ['거시경제', '옵션', '포트폴리오', '+5'],
    count: '230문제 · 권장 Lv.8+',
    progressPct: 0,
    progressText: '잠금 🔒',
    progressColor: 'var(--t3)',
    recommended: false,
    locked: true,
  },
  {
    id: 'custom',
    badge: 'AI',
    badgeBg: 'linear-gradient(135deg, #EC4899, #F59E0B)',
    className: 'custom',
    title: '개인 맞춤 학습',
    desc: 'AI가 분석한 약점 보강.\n매일 갱신되는 개인 코스.',
    tags: ['자주 틀린 영역', 'PER · 재무비율'],
    count: '오늘 추천 12문제',
    progressPct: 0,
    progressText: '새 코스',
    progressColor: 'var(--accent)',
    recommended: false,
    locked: false,
  },
]

const RECENT_ACTIVITY = [
  { pillVariant: 'success' as const, label: '완료', text: '기초 용어 · PER이란 무엇을 의미할까요?', time: '방금 · +500원' },
  { pillVariant: 'warning' as const, label: '오답', text: '차트 기초 · 이동평균선의 골든크로스', time: '2시간 전' },
  { pillVariant: 'success' as const, label: '완료', text: '시장 이해 · 코스피와 코스닥의 차이', time: '어제 · +500원' },
]

export default function LearnPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="page-title">
        <div>
          <h1>투자학습</h1>
          <div className="page-sub">수준에 맞춘 학습 코스를 선택해 자금을 모아보세요</div>
        </div>
        <Button variant="outline">등급 재진단</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card variant="hero" className="card-lg">
          <div className="row">
            <div>
              <Pill variant="outline-light">현재 등급</Pill>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>
                {user?.level ?? '초급 Lv.2'} · 정답률 78%
              </div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>누적 142문제 · 정답 111문제</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>다음 등급까지</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>12문제</div>
            </div>
          </div>
          <Progress value={65} variant="hero" style={{ marginTop: 18 }} />
          <div style={{ opacity: 0.85, fontSize: 12, marginTop: 8 }}>
            초급 Lv.2 → 중급 Lv.1까지 65%
          </div>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill variant="accent">주간 미션</Pill>
            <span className="muted" style={{ fontSize: 12 }}>4 / 7</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>7일 연속 학습</div>
          <div className="muted" style={{ marginTop: 4 }}>달성 시 +5,000원</div>
          <div className="mission-gauge" style={{ marginTop: 18 }}>
            {[true, true, true, true, false, false, false].map((fill, i) => (
              <span key={i} className={fill ? 'fill' : ''} />
            ))}
          </div>
          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>월 화 수 목 금 토 일</div>
        </Card>
      </div>

      <div className="section-title" style={{ marginBottom: 14 }}>학습 코스 선택</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {LEVELS.map((lv) => (
          <div
            key={lv.id}
            className={`level-card ${lv.className}`}
            onClick={() => !lv.locked && navigate(`/learn/${lv.id}`)}
            style={lv.locked ? { cursor: 'not-allowed' } : {}}
          >
            {lv.recommended && <span className="recommended-tag">추천</span>}
            <div className="lv-badge" style={{ background: lv.badgeBg }}>{lv.badge}</div>
            <div>
              <div className="lv-title">{lv.title}</div>
              <div className="lv-desc" style={{ marginTop: 6 }}>
                {lv.desc.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
              </div>
            </div>
            <div className="lv-tags">
              {lv.tags.map((tag) => <span key={tag} className="lv-tag">{tag}</span>)}
            </div>
            <div className="lv-foot">
              <span>{lv.count}</span>
              <span className="pct" style={{ color: lv.progressColor }}>{lv.progressText}</span>
            </div>
          </div>
        ))}
      </div>

      <Card style={{ marginTop: 24 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>최근 학습</div>
          <span style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)' }}>전체 기록 →</span>
        </div>
        {RECENT_ACTIVITY.map((item) => (
          <div key={item.text} className="activity-row">
            <div className="left">
              <Pill variant={item.pillVariant}>{item.label}</Pill>
              <span>{item.text}</span>
            </div>
            <span className="muted" style={{ fontSize: 12 }}>{item.time}</span>
          </div>
        ))}
      </Card>
    </AppLayout>
  )
}
