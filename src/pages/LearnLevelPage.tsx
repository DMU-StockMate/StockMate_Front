import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Progress from '../components/common/Progress'
import Pill from '../components/common/Pill'
import Chip, { ChipRow } from '../components/common/Chip'
import { api_get_histories, api_get_questions, api_get_statistics, type LearningStatistics, type QuizAttempt } from '../api/learning'

interface TopicData {
  id: string
  icon: string
  title: string
  desc: string
  status: 'active' | 'not-started'
}

interface BackendQuestionItem {
  id: number
  question: string
  type: string
  reward: number
  solved: boolean
}

type FilterType = '전체' | '진행 중' | '미시작'

const LEVEL_META: Record<string, {
  badge: string
  badgeBg: string
  title: string
  sub: string
  topics: TopicData[]
}> = {
  beginner: {
    badge: '초',
    badgeBg: '#10B981',
    title: '초급 학습',
    sub: '투자 입문자를 위한 기초 과정',
    topics: [
      { id: 'basic-terms', icon: 'bi-book', title: '기초 용어', desc: 'PER, EPS, ROE 등 투자에서 자주 쓰는 핵심 용어를 익힙니다.', status: 'active' },
      { id: 'chart-basics', icon: 'bi-graph-up-arrow', title: '차트 기초', desc: '캔들, 이동평균선, 거래량 등 차트의 기본 구성 요소를 배웁니다.', status: 'active' },
      { id: 'market-basics', icon: 'bi-bank', title: '시장 이해', desc: '시장 구조, 거래시간, 시장 종류를 이해합니다.', status: 'not-started' },
      { id: 'trading-basics', icon: 'bi-cash-coin', title: '매매의 기본', desc: '호가, 주문 종류, 체결 방식 등 실전 매매에 필요한 기본기.', status: 'not-started' },
      { id: 'risk-return', icon: 'bi-sliders', title: '위험과 수익', desc: '리스크와 수익의 관계, 분산투자 원리를 이해합니다.', status: 'not-started' },
      { id: 'stock-analysis', icon: 'bi-search', title: '종목 분석 입문', desc: '기본적/기술적 분석의 차이와 활용법을 익힙니다.', status: 'not-started' },
    ],
  },
  intermediate: {
    badge: '중',
    badgeBg: '#3B82F6',
    title: '중급 학습',
    sub: '핵심 지표 분석과 실전 투자',
    topics: [
      { id: 'financial-statements', icon: 'bi-bar-chart-line', title: '재무제표 분석', desc: '손익계산서, 대차대조표, 현금흐름표 핵심 분석법.', status: 'active' },
      { id: 'valuation', icon: 'bi-gem', title: '가치평가', desc: 'PER, PBR, EV/EBITDA 등을 활용한 적정 가치 산출.', status: 'active' },
      { id: 'industry-analysis', icon: 'bi-building', title: '산업 분석', desc: '섹터별 특성과 경쟁구조, 산업 사이클 이해.', status: 'not-started' },
      { id: 'technical-analysis', icon: 'bi-graph-down-arrow', title: '기술적 분석', desc: '추세선, 패턴, 보조지표를 활용한 매매 타이밍.', status: 'not-started' },
      { id: 'etf-fund', icon: 'bi-folder2-open', title: 'ETF & 펀드', desc: 'ETF 구조, 운용 방식, 배당과 수수료 비교.', status: 'not-started' },
      { id: 'macro', icon: 'bi-globe2', title: '거시경제 입문', desc: '금리, 환율, 인플레이션이 시장에 미치는 영향.', status: 'not-started' },
    ],
  },
  advanced: {
    badge: '고',
    badgeBg: '#6D29D9',
    title: '고급 학습',
    sub: '심화된 전략과 고급 분석',
    topics: [
      { id: 'macro-advanced', icon: 'bi-globe2', title: '거시경제 심화', desc: '중앙은행 정책, 글로벌 자금 흐름, 통화량 분석.', status: 'active' },
      { id: 'options', icon: 'bi-lightning-charge', title: '옵션 & 파생상품', desc: '콜·풋 옵션의 원리와 헤지 전략.', status: 'not-started' },
      { id: 'portfolio', icon: 'bi-bullseye', title: '포트폴리오 관리', desc: '자산배분, 리밸런싱, 샤프 비율 등 포트폴리오 최적화.', status: 'not-started' },
      { id: 'quant', icon: 'bi-cpu', title: '퀀트 전략', desc: '팩터 투자, 모멘텀 전략, 백테스트 기초.', status: 'not-started' },
      { id: 'global-market', icon: 'bi-map', title: '글로벌 시장', desc: '해외 주식, 해외 ETF, 환헤지 방법.', status: 'not-started' },
      { id: 'tax', icon: 'bi-receipt', title: '세금과 제도', desc: '양도소득세와 절세 전략.', status: 'not-started' },
    ],
  },
  custom: {
    badge: 'AI',
    badgeBg: 'linear-gradient(135deg, #EC4899, #F59E0B)',
    title: '개인 맞춤 학습',
    sub: 'AI 생성 문제와 오답 복습',
    topics: [
      { id: 'basic-terms', icon: 'bi-stars', title: 'AI 생성 문제', desc: '현재 등록된 문제와 AI 생성 문제를 이어서 풉니다.', status: 'active' },
    ],
  },
}

const statusLabel: Record<TopicData['status'], string> = {
  active: '진행 가능',
  'not-started': '미시작',
}

const pillVariantForStatus: Record<TopicData['status'], 'primary' | 'gray'> = {
  active: 'primary',
  'not-started': 'gray',
}

const as_record = (value: unknown) => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
)

const get_array = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw
  const item = as_record(raw)
  const nested = item.data ?? item.items ?? item.content ?? item.questions
  return Array.isArray(nested) ? nested : []
}

const get_question_id = (raw: unknown) => {
  const item = as_record(raw)
  return Number(item.question_id ?? item.questionId ?? 0)
}

const get_attempt_question_id = (attempt: QuizAttempt) => (
  Number(attempt.question_id ?? attempt.questionId ?? attempt.question?.question_id ?? attempt.question?.questionId ?? 0)
)

const normalize_backend_question = (raw: unknown, solvedIds: Set<number>): BackendQuestionItem | null => {
  const item = as_record(raw)
  const id = get_question_id(item)
  const question = String(item.question_text ?? item.questionText ?? '')

  if (!id || !question) return null

  return {
    id,
    question,
    type: String(item.question_type ?? item.questionType ?? 'MULTIPLE_CHOICE'),
    reward: Number(item.reward_cash ?? item.rewardCash ?? 0),
    solved: solvedIds.has(id),
  }
}

export default function LearnLevelPage() {
  const { section = 'beginner' } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('전체')
  const [backendQuestions, setBackendQuestions] = useState<BackendQuestionItem[]>([])
  const [stats, setStats] = useState<LearningStatistics | null>(null)
  const [questionLoadError, setQuestionLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const meta = LEVEL_META[section] ?? LEVEL_META.beginner

  useEffect(() => {
    let alive = true

    const load_learning = async () => {
      setLoading(true)
      setQuestionLoadError('')

      try {
        const [questionsResult, historiesResult, statsResult] = await Promise.allSettled([
          api_get_questions(),
          api_get_histories(),
          api_get_statistics(),
        ])

        if (questionsResult.status !== 'fulfilled') {
          throw new Error('question load failed')
        }

        const solvedIds = new Set(
          historiesResult.status === 'fulfilled'
            ? (get_array(historiesResult.value.data) as QuizAttempt[]).map(get_attempt_question_id).filter((id) => id > 0)
            : [],
        )

        const questions = get_array(questionsResult.value.data)
          .map((item) => normalize_backend_question(item, solvedIds))
          .filter((item): item is BackendQuestionItem => item !== null)
          .sort((a, b) => a.id - b.id)

        if (!alive) return

        setBackendQuestions(questions)
        if (statsResult.status === 'fulfilled') setStats(statsResult.value.data)
      } catch {
        if (!alive) return
        setBackendQuestions([])
        setQuestionLoadError('문제 목록 API 연결에 실패했습니다. 로그인 상태와 백엔드 서버를 확인해주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load_learning()

    return () => {
      alive = false
    }
  }, [])

  const filteredTopics = meta.topics.filter((t) => {
    if (filter === '전체') return true
    if (filter === '진행 중') return t.status === 'active'
    if (filter === '미시작') return t.status === 'not-started'
    return true
  })

  const solvedCount = useMemo(() => backendQuestions.filter((question) => question.solved).length, [backendQuestions])
  const progressPct = Math.round((solvedCount / Math.max(backendQuestions.length, 1)) * 100)
  const earned = useMemo(() => backendQuestions.filter((question) => question.solved).reduce((sum, question) => sum + question.reward, 0), [backendQuestions])

  const handle_topic_click = (topic: TopicData) => {
    navigate(`/learn/${section}/${topic.id}`)
  }

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{meta.title}</span>
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className="lv-badge"
            style={{ width: 56, height: 56, borderRadius: 16, fontSize: 24, background: meta.badgeBg }}
          >
            {meta.badge}
          </div>
          <div>
            <h1>{meta.title}</h1>
            <div className="page-sub">{meta.sub}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: 12 }}>전체 진행률</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{progressPct}%</div>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { label: '총 문제', value: backendQuestions.length, color: '' },
            { label: '완료', value: solvedCount, color: 'var(--success)' },
            { label: '정답률', value: `${stats?.accuracy ?? 0}%`, color: '' },
            { label: '획득 자금', value: `+${earned.toLocaleString()}원`, color: 'var(--primary)' },
          ].map((s) => (
            <div key={s.label}>
              <div className="label">{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color || 'var(--t1)', marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <Progress value={progressPct} style={{ marginTop: 18 }} />
      </Card>

      <div style={{ marginBottom: 28 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>등록 문제 {backendQuestions.length}개</div>
          {questionLoadError && <span className="muted" style={{ fontSize: 12 }}>{questionLoadError}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {loading && (
            <Card style={{ gridColumn: '1 / -1' }}>
              <div className="muted">문제 목록을 불러오는 중입니다.</div>
            </Card>
          )}
          {!loading && backendQuestions.map((question) => (
            <div
              key={question.id}
              className={`quiz-mini ${question.solved ? 'done' : 'available'}`}
              onClick={() => navigate(`/learn/quiz/basic-terms/${question.id}`)}
            >
              <div className="qm-num">Q{question.id} · {question.type === 'OX' ? 'OX' : '객관식'}</div>
              <div className="qm-q">{question.question}</div>
              <div className="qm-foot">
                <span>{question.solved ? '풀이 완료' : '미완료'}</span>
                <Pill variant={question.solved ? 'success' : 'primary'}>+{question.reward.toLocaleString()}원</Pill>
              </div>
            </div>
          ))}
          {!loading && backendQuestions.length === 0 && (
            <Card style={{ gridColumn: '1 / -1' }}>
              <div className="muted">아직 표시할 문제가 없습니다.</div>
            </Card>
          )}
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>대주제 {meta.topics.length}개</div>
        <ChipRow>
          {(['전체', '진행 중', '미시작'] as FilterType[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </ChipRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            className="topic-card"
            onClick={() => handle_topic_click(topic)}
          >
            <div className="row">
              <div className="topic-ico"><i className={`bi ${topic.icon}`} /></div>
              <Pill variant={pillVariantForStatus[topic.status]}>
                {statusLabel[topic.status]}
              </Pill>
            </div>
            <div>
              <div className="topic-title">{topic.title}</div>
              <div className="topic-desc">{topic.desc}</div>
            </div>
            <Progress value={0} max={1} thin />
            <div className="topic-stats">
              <span>문제 API 기준으로 목록을 표시합니다.</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
