import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api_generate_from_wrong_notes, type AiQuestionType } from '../api/ai'
import {
  api_get_bookmarks,
  api_get_histories,
  api_get_questions,
  api_get_wrong_notes,
  type QuizAttempt,
  type QuizBookmark,
  type QuizChoice,
} from '../api/learning'
import { as_record, get_array } from '../utils/normalize'

export interface QuizItem {
  id: number
  topicId: number | null
  question: string
  difficulty: '쉬움' | '보통' | '어려움'
  reward: number
  status: 'done' | 'current' | 'available'
  isWrong: boolean
  isBookmarked: boolean
}

export interface TopicMeta {
  icon: string
  title: string
  sectionLabel: string
}

export type FilterType = '전체' | '미완료' | '완료' | '오답' | '찜'

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

const FALLBACK_META: TopicMeta = { icon: 'bi-journal-text', title: '학습 콘텐츠', sectionLabel: '학습' }

const TOPIC_ID_MAP: Record<string, number> = {
  'basic-terms': 1, 'chart-basics': 3, 'market-basics': 4,
  'trading-basics': 5, 'risk-return': 6, 'financial-statements': 7,
  valuation: 8, 'industry-analysis': 9, 'technical-analysis': 10,
  'etf-fund': 11, macro: 12,
}

const INVESTMENT_LEVEL_ID_MAP: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3,
}

const get_question_id = (raw: unknown) => {
  const item = as_record(raw)
  return Number(item.question_id ?? item.questionId ?? 0)
}

const get_attempt_question_id = (attempt: QuizAttempt) =>
  Number(attempt.question_id ?? attempt.questionId ?? attempt.question?.question_id ?? attempt.question?.questionId ?? 0)

const get_bookmark_question_id = (bookmark: QuizBookmark) =>
  Number(bookmark.question_id ?? bookmark.questionId ?? bookmark.question?.question_id ?? bookmark.question?.questionId ?? 0)

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

// QuizChoice를 api/learning에서 import하지만 실제로는 타입만 사용함
type _QuizChoice = QuizChoice

export function useLearnTopic() {
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
    const load = async () => {
      setLoading(true)
      setQuestionLoadError('')
      try {
        const [questionsRes, historiesRes, wrongRes, bookmarkRes] = await Promise.allSettled([
          api_get_questions(),
          api_get_histories(),
          api_get_wrong_notes(),
          api_get_bookmarks(),
        ])
        if (questionsRes.status !== 'fulfilled') throw new Error('question load failed')

        const doneIds = new Set(
          historiesRes.status === 'fulfilled'
            ? (get_array(historiesRes.value.data) as QuizAttempt[]).map(get_attempt_question_id).filter((id) => id > 0)
            : [],
        )
        const wrongIds = new Set(
          wrongRes.status === 'fulfilled'
            ? (get_array(wrongRes.value.data) as QuizAttempt[]).map(get_attempt_question_id).filter((id) => id > 0)
            : [],
        )
        const bookmarkIds = new Set(
          bookmarkRes.status === 'fulfilled'
            ? (get_array(bookmarkRes.value.data) as QuizBookmark[]).map(get_bookmark_question_id).filter((id) => id > 0)
            : [],
        )

        const normalized = get_array(questionsRes.value.data)
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
    void load()
    return () => { alive = false }
  }, [mappedTopicId])

  const filtered = quizzes.filter((q) => {
    if (filter === '전체') return true
    if (filter === '미완료') return q.status !== 'done'
    if (filter === '완료') return q.status === 'done'
    if (filter === '오답') return q.isWrong
    if (filter === '찜') return q.isBookmarked
    return true
  })

  const totalDone = useMemo(() => quizzes.filter((q) => q.status === 'done').length, [quizzes])
  const wrongCount = useMemo(() => quizzes.filter((q) => q.isWrong).length, [quizzes])
  const correctCount = Math.max(0, totalDone - wrongCount)
  const earned = useMemo(
    () => quizzes.filter((q) => q.status === 'done' && !q.isWrong).reduce((sum, q) => sum + q.reward, 0),
    [quizzes],
  )
  const progressPct = Math.round((totalDone / Math.max(quizzes.length, 1)) * 100)
  const nextQuiz = quizzes.find((q) => q.status === 'current' || q.status === 'available')

  const handle_quiz_click = (quiz: QuizItem) => navigate(`/learn/quiz/${topic}/${quiz.id}`)

  const handle_generate_question = async (questionType: AiQuestionType) => {
    const wrongQuestionIds = quizzes.filter((q) => q.isWrong).map((q) => q.id).slice(0, 50)
    if (wrongQuestionIds.length === 0) {
      setGenerateError('아직 이 주제에서 틀린 문제가 없습니다. 문제를 먼저 풀어본 뒤 다시 시도해주세요.')
      return
    }

    setGeneratingType(questionType)
    setGenerateError('')
    try {
      const { data } = await api_generate_from_wrong_notes({
        questionIds: wrongQuestionIds,
        topicId: mappedTopicId ?? undefined,
        investmentLevelId: INVESTMENT_LEVEL_ID_MAP[section] ?? 1,
        questionType,
      })
      const generated = data.questions[0]
      if (!generated) throw new Error('empty batch')
      navigate(`/learn/quiz/${topic}/${generated.questionId}`)
    } catch {
      setGenerateError('AI 문제 생성에 실패했습니다. 백엔드 AI 서버 상태를 확인해주세요.')
    } finally {
      setGeneratingType(null)
    }
  }

  return {
    topic, section, meta, filter, setFilter,
    generatingType, generateError, quizzes, filtered,
    questionLoadError, loading,
    totalDone, wrongCount, correctCount, earned, progressPct, nextQuiz,
    handle_quiz_click, handle_generate_question,
  }
}
