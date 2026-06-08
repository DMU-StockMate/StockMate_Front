import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import Progress from '../components/common/Progress'
import { api_get_histories, api_get_questions, api_get_statistics, type LearningStatistics, type QuizAttempt } from '../api/learning'

const LEVELS = [
  {
    id: 'beginner',
    badge: '초',
    badgeBg: '#10B981',
    className: 'beginner',
    title: '초급 학습',
    desc: '투자가 처음이라면 여기서 시작.\n기초 용어와 시장 구조부터.',
    tags: ['기초 용어', '차트 기초', '시장 이해'],
    locked: false,
  },
  {
    id: 'intermediate',
    badge: '중',
    badgeBg: '#3B82F6',
    className: 'intermediate',
    title: '중급 학습',
    desc: '핵심 지표 분석과 실전.\n가치평가, 산업 분석까지.',
    tags: ['재무제표', '가치평가', '산업 분석'],
    locked: false,
  },
  {
    id: 'advanced',
    badge: '고',
    badgeBg: '#6D29D9',
    className: 'advanced',
    title: '고급 학습',
    desc: '심화된 전략과 분석.\n거시경제, 옵션, 포트폴리오.',
    tags: ['거시경제', '옵션', '포트폴리오'],
    locked: false,
  },
  {
    id: 'custom',
    badge: 'AI',
    badgeBg: 'linear-gradient(135deg, #EC4899, #F59E0B)',
    className: 'custom',
    title: '개인 맞춤 학습',
    desc: 'AI가 분석한 약점 보강.\n생성 문제로 바로 복습.',
    tags: ['오답 복습', 'AI 생성 문제'],
    locked: false,
  },
]

const as_record = (value: unknown) => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
)

const get_array = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw
  const item = as_record(raw)
  const nested = item.data ?? item.items ?? item.content ?? item.questions
  return Array.isArray(nested) ? nested : []
}

const get_attempt_question_text = (attempt: QuizAttempt) => (
  String(attempt.question?.question_text ?? attempt.question?.questionText ?? `Q${attempt.question_id ?? attempt.questionId ?? ''}`)
)

const get_attempt_time = (attempt: QuizAttempt) => (
  String(attempt.solved_at ?? attempt.solvedAt ?? '')
)

const get_attempt_reward = (attempt: QuizAttempt) => (
  Number(attempt.reward_cash_earned ?? attempt.rewardCashEarned ?? 0)
)

export default function LearnPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<LearningStatistics | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [histories, setHistories] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const loadLearning = async () => {
      setLoading(true)
      try {
        const [statsResult, questionsResult, historiesResult] = await Promise.allSettled([
          api_get_statistics(),
          api_get_questions(),
          api_get_histories(),
        ])

        if (!alive) return

        if (statsResult.status === 'fulfilled') setStats(statsResult.value.data)
        if (questionsResult.status === 'fulfilled') setQuestionCount(get_array(questionsResult.value.data).length)
        if (historiesResult.status === 'fulfilled') {
          setHistories(get_array(historiesResult.value.data) as QuizAttempt[])
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadLearning()

    return () => {
      alive = false
    }
  }, [])

  const accuracy = stats?.accuracy ?? 0
  const progressValue = Math.min(100, accuracy)
  const remainingForNextLevel = Math.max(0, 50 - (stats?.correct ?? 0))
  const recentHistories = useMemo(() => histories.slice(0, 3), [histories])

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
                {user?.level ?? '초급 Lv.1'} · 정답률 {loading ? '-' : `${accuracy}%`}
              </div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>
                누적 {stats?.total ?? 0}문제 · 정답 {stats?.correct ?? 0}문제
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>다음 등급까지</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{remainingForNextLevel}문제</div>
            </div>
          </div>
          <Progress value={progressValue} variant="hero" style={{ marginTop: 18 }} />
          <div style={{ opacity: 0.85, fontSize: 12, marginTop: 8 }}>
            실제 학습 통계 API 기준
          </div>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill variant="accent">학습 현황</Pill>
            <span className="muted" style={{ fontSize: 12 }}>{stats?.total ?? 0} / {questionCount}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>등록 문제 {questionCount}개</div>
          <div className="muted" style={{ marginTop: 4 }}>정답 {stats?.correct ?? 0} · 오답 {stats?.wrong ?? 0}</div>
          <Progress value={stats?.total ?? 0} max={Math.max(questionCount, 1)} style={{ marginTop: 16 }} />
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>풀이 진행률</span>
            <Button size="sm" onClick={() => navigate('/learn/beginner/basic-terms')}>
              <i className="bi bi-play-fill" />
              학습 시작
            </Button>
          </div>
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
              <span>{questionCount}문제</span>
              <span className="pct" style={{ color: 'var(--primary)' }}>
                API 연동
              </span>
            </div>
          </div>
        ))}
      </div>

      <Card style={{ marginTop: 24 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>최근 학습</div>
          <span style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate('/mypage')}>
            전체 기록 →
          </span>
        </div>
        {loading && <div className="muted">학습 기록을 불러오는 중입니다.</div>}
        {!loading && recentHistories.length === 0 && <div className="muted">아직 학습 기록이 없습니다.</div>}
        {!loading && recentHistories.map((item) => {
          const correct = item.is_correct ?? item.isCorrect ?? false
          const reward = get_attempt_reward(item)
          return (
            <div key={`${item.question_id ?? item.questionId}-${get_attempt_time(item)}`} className="activity-row">
              <div className="left">
                <Pill variant={correct ? 'success' : 'warning'}>{correct ? '완료' : '오답'}</Pill>
                <span>{get_attempt_question_text(item)}</span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {get_attempt_time(item) || '-'}{reward > 0 ? ` · +${reward.toLocaleString()}원` : ''}
              </span>
            </div>
          )
        })}
      </Card>
    </AppLayout>
  )
}
