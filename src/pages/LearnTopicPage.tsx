import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import Pill from '../components/common/Pill'
import Chip, { ChipRow } from '../components/common/Chip'
import { api_generate_ai_question, type AiQuestionType } from '../api/ai'
import {
  api_get_bookmarks,
  api_get_histories,
  api_get_questions,
  api_get_wrong_notes,
  type QuizAttempt,
  type QuizBookmark,
} from '../api/learning'

interface QuizItem {
  id: number
  topicId: number | null
  question: string
  difficulty: '쉬움' | '보통' | '어려움'
  reward: number
  status: 'done' | 'current' | 'available'
  isWrong: boolean
  isBookmarked: boolean
}

interface TopicMeta {
  icon: string
  title: string
  sectionLabel: string
}

type FilterType = '전체' | '미완료' | '완료' | '오답' | '찜'

const TOPIC_META: Record<string, TopicMeta> = {
  'basic-terms': { icon: 'bi-book', title: '기초 용어', sectionLabel: '초급 학습' },
  'chart-basics': { icon: 'bi-graph-up-arrow', title: '차트 기초', sectionLabel: '초급 학습' },
  'market-basics': { icon: 'bi-bank', title: '시장 이해', sectionLabel: '초급 학습' },
  'trading-basics': { icon: 'bi-cash-coin', title: '매매의 기본', sectionLabel: '초급 학습' },
  'risk-return': { icon: 'bi-sliders', title: '위험과 수익', sectionLabel: '초급 학습' },
  'financial-statements': { icon: 'bi-bar-chart-line', title: '재무제표 분석', sectionLabel: '중급 학습' },
  valuation: { icon: 'bi-gem', title: '가치평가', sectionLabel: '중급 학습' },
  'industry-analysis': { icon: 'bi-building', title: '산업 분석', sectionLabel: '중급 학습' },
  'technical-analysis': { icon: 'bi-graph-down-arrow', title: '기술적 분석', sectionLabel: '중급 학습' },
  'etf-fund': { icon: 'bi-folder2-open', title: 'ETF & 펀드', sectionLabel: '중급 학습' },
  macro: { icon: 'bi-globe2', title: '거시경제 입문', sectionLabel: '중급 학습' },
}

const FALLBACK_META: TopicMeta = {
  icon: 'bi-journal-text',
  title: '학습 콘텐츠',
  sectionLabel: '학습',
}

const TOPIC_ID_MAP: Record<string, number> = {
  'basic-terms': 1,
  'chart-basics': 3,
  'market-basics': 4,
  'trading-basics': 5,
  'risk-return': 6,
  'financial-statements': 7,
  valuation: 8,
  'industry-analysis': 9,
  'technical-analysis': 10,
  'etf-fund': 11,
  macro: 12,
}

const INVESTMENT_LEVEL_ID_MAP: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
}

const as_record = (value: unknown) => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
)

const get_question_id = (raw: unknown) => {
  const item = as_record(raw)
  return Number(item.question_id ?? item.questionId ?? 0)
}

const get_question_array = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw
  const item = as_record(raw)
  const nested = item.data ?? item.items ?? item.content ?? item.questions
  return Array.isArray(nested) ? nested : []
}

const normalize_question = (raw: unknown): Omit<QuizItem, 'status' | 'isWrong' | 'isBookmarked'> | null => {
  const item = as_record(raw)
  const id = get_question_id(item)
  const question = String(item.question_text ?? item.questionText ?? '')
  const levelId = Number(item.investment_level_id ?? item.investmentLevelId ?? 1)

  if (!id || !question) return null

  return {
    id,
    topicId: Number(item.topic_id ?? item.topicId ?? 0) || null,
    question,
    difficulty: levelId > 2 ? '어려움' : levelId > 1 ? '보통' : '쉬움',
    reward: Number(item.reward_cash ?? item.rewardCash ?? 0),
  }
}

const get_attempt_question_id = (attempt: QuizAttempt) => (
  Number(attempt.question_id ?? attempt.questionId ?? attempt.question?.question_id ?? attempt.question?.questionId ?? 0)
)

const get_bookmark_question_id = (bookmark: QuizBookmark) => (
  Number(bookmark.question_id ?? bookmark.questionId ?? bookmark.question?.question_id ?? bookmark.question?.questionId ?? 0)
)

export default function LearnTopicPage() {
  const { section = 'beginner', topic = 'basic-terms' } = useParams<{ section: string; topic: string }>()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('전체')
  const [generatingType, setGeneratingType] = useState<AiQuestionType | null>(null)
  const [generateError, setGenerateError] = useState('')
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [questionLoadError, setQuestionLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const meta = TOPIC_META[topic] ?? FALLBACK_META
  const mappedTopicId = TOPIC_ID_MAP[topic] ?? null

  useEffect(() => {
    let alive = true

    const load_questions = async () => {
      setLoading(true)
      setQuestionLoadError('')

      try {
        const [questionsResult, historiesResult, wrongResult, bookmarkResult] = await Promise.allSettled([
          api_get_questions(),
          api_get_histories(),
          api_get_wrong_notes(),
          api_get_bookmarks(),
        ])

        if (questionsResult.status !== 'fulfilled') {
          throw new Error('question load failed')
        }

        const doneIds = new Set(
          historiesResult.status === 'fulfilled'
            ? (get_question_array(historiesResult.value.data) as QuizAttempt[]).map(get_attempt_question_id).filter((id) => id > 0)
            : [],
        )
        const wrongIds = new Set(
          wrongResult.status === 'fulfilled'
            ? (get_question_array(wrongResult.value.data) as QuizAttempt[]).map(get_attempt_question_id).filter((id) => id > 0)
            : [],
        )
        const bookmarkIds = new Set(
          bookmarkResult.status === 'fulfilled'
            ? (get_question_array(bookmarkResult.value.data) as QuizBookmark[]).map(get_bookmark_question_id).filter((id) => id > 0)
            : [],
        )

        const normalized = get_question_array(questionsResult.value.data)
          .map(normalize_question)
          .filter((item): item is Omit<QuizItem, 'status' | 'isWrong' | 'isBookmarked'> => item !== null)
          .filter((item) => !mappedTopicId || item.topicId === mappedTopicId)
          .sort((a, b) => a.id - b.id)

        const firstPendingId = normalized.find((item) => !doneIds.has(item.id))?.id ?? null
        const nextQuizzes = normalized.map((item) => ({
          ...item,
          status: doneIds.has(item.id) ? 'done' as const : item.id === firstPendingId ? 'current' as const : 'available' as const,
          isWrong: wrongIds.has(item.id),
          isBookmarked: bookmarkIds.has(item.id),
        }))

        if (!alive) return
        setQuizzes(nextQuizzes)
      } catch {
        if (!alive) return
        setQuizzes([])
        setQuestionLoadError('문제 목록 API 연결에 실패했습니다. 로그인 상태와 백엔드 서버를 확인해주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load_questions()

    return () => {
      alive = false
    }
  }, [mappedTopicId])

  const filtered = quizzes.filter((q) => {
    if (filter === '전체') return true
    if (filter === '미완료') return q.status !== 'done'
    if (filter === '완료') return q.status === 'done'
    if (filter === '오답') return q.isWrong
    if (filter === '찜') return q.isBookmarked
    return true
  })

  const totalDone = useMemo(() => quizzes.filter((quiz) => quiz.status === 'done').length, [quizzes])
  const wrongCount = useMemo(() => quizzes.filter((quiz) => quiz.isWrong).length, [quizzes])
  const correctCount = Math.max(0, totalDone - wrongCount)
  const earned = useMemo(() => quizzes.filter((quiz) => quiz.status === 'done' && !quiz.isWrong).reduce((sum, quiz) => sum + quiz.reward, 0), [quizzes])
  const progressPct = Math.round((totalDone / Math.max(quizzes.length, 1)) * 100)

  const handle_quiz_click = (quiz: QuizItem) => {
    navigate(`/learn/quiz/${topic}/${quiz.id}`)
  }

  const handle_generate_question = async (questionType: AiQuestionType) => {
    setGeneratingType(questionType)
    setGenerateError('')

    try {
      const { data: generated } = await api_generate_ai_question({
        topicId: mappedTopicId ?? 1,
        investmentLevelId: INVESTMENT_LEVEL_ID_MAP[section] ?? 1,
        questionType,
      })
      navigate(`/learn/quiz/${topic}/${generated.questionId}`)
    } catch {
      setGenerateError('AI 문제 생성에 실패했습니다. 백엔드 AI 서버 상태를 확인해주세요.')
    } finally {
      setGeneratingType(null)
    }
  }

  const nextQuiz = quizzes.find((quiz) => quiz.status === 'current' || quiz.status === 'available')

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => navigate(`/learn/${section}`)}>{meta.sectionLabel}</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{meta.title}</span>
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="topic-ico" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 28 }}>
            <i className={`bi ${meta.icon}`} />
          </div>
          <div>
            <h1>{meta.title}</h1>
            <div className="page-sub">{meta.sectionLabel} · {quizzes.length}문제</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="outline"
            onClick={() => void handle_generate_question('OX')}
            disabled={generatingType !== null}
          >
            <i className="bi bi-stars" />
            {generatingType === 'OX' ? '생성 중...' : 'AI OX 생성'}
          </Button>
          <Button
            variant="outline"
            onClick={() => void handle_generate_question('MULTIPLE_CHOICE')}
            disabled={generatingType !== null}
          >
            <i className="bi bi-magic" />
            {generatingType === 'MULTIPLE_CHOICE' ? '생성 중...' : 'AI 객관식 생성'}
          </Button>
          <Button variant="outline" disabled={!nextQuiz} onClick={() => nextQuiz && navigate(`/learn/quiz/${topic}/${nextQuiz.id}`)}>
            한 번에 풀기
          </Button>
          <Button disabled={!nextQuiz} onClick={() => nextQuiz && navigate(`/learn/quiz/${topic}/${nextQuiz.id}`)}>
            이어서 풀기 →
          </Button>
        </div>
      </div>

      {(generateError || questionLoadError) && (
        <div className="ai-block" style={{ marginBottom: 20 }}>
          <span className="ai-tag">알림</span>
          <span style={{ fontSize: 14 }}>{generateError || questionLoadError}</span>
        </div>
      )}

      <Card style={{ marginBottom: 20, background: 'var(--gradient-soft)', borderColor: '#D8CDF0' }}>
        <div className="row">
          <div>
            <div className="strong" style={{ fontSize: 15 }}>
              {totalDone} / {quizzes.length} 문제 풀이 완료
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              정답 {correctCount} · 오답 {wrongCount} · 정답률 {totalDone > 0 ? Math.round((correctCount / totalDone) * 100) : 0}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 12 }}>획득 자금</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
              +{earned.toLocaleString()}원
            </div>
          </div>
        </div>
        <Progress value={progressPct} style={{ marginTop: 14 }} />
      </Card>

      <div className="row" style={{ marginBottom: 16 }}>
        <ChipRow>
          {(['전체', '미완료', '완료', '오답', '찜'] as FilterType[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </ChipRow>
        <span className="muted" style={{ fontSize: 12 }}>실제 문제 API 기준</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {loading && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="muted">문제 목록을 불러오는 중입니다.</div>
          </Card>
        )}
        {!loading && filtered.length === 0 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="muted">표시할 문제가 없습니다.</div>
          </Card>
        )}
        {!loading && filtered.map((quiz) => (
          <div
            key={quiz.id}
            className={`quiz-mini ${quiz.status === 'done' ? 'done' : ''} ${quiz.status === 'current' ? 'current' : ''}`}
            onClick={() => handle_quiz_click(quiz)}
          >
            <div className="qm-num" style={quiz.status === 'current' ? { color: 'var(--accent)' } : {}}>
              Q{quiz.id}{quiz.status === 'current' ? ' · 다음 문제' : ''}
            </div>
            <div className="qm-q">{quiz.question}</div>
            <div className="qm-foot">
              <span>{quiz.difficulty}</span>
              <Pill variant={quiz.status === 'done' ? 'success' : 'primary'}>
                +{quiz.reward.toLocaleString()}원
              </Pill>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
