import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  api_get_bookmarks,
  api_get_histories,
  api_get_questions,
  api_get_topics,
  api_get_wrong_notes,
  type LearningTopic,
  type QuizAttempt,
  type QuizBookmark,
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
  desc: string
}

export type FilterType = '전체' | '미완료' | '완료' | '오답' | '찜'

const PAGE_SIZE = 20

// 백엔드 learning_topics 테이블에는 아이콘이 없어서 표시용으로만 클라이언트에서 매핑한다.
const ICON_BY_TOPIC_ID: Record<number, string> = {
  1: 'bi-sliders', 2: 'bi-percent', 3: 'bi-gem', 4: 'bi-bar-chart-line', 5: 'bi-graph-down-arrow',
}
const DEFAULT_ICON = 'bi-journal-text'

export const LEVEL_LABEL: Record<string, string> = {
  beginner: '초급 학습', intermediate: '중급 학습', advanced: '고급 학습',
}

export const INVESTMENT_LEVEL_ID_MAP: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3,
}

export const get_topic_icon = (topicId: number) => ICON_BY_TOPIC_ID[topicId] ?? DEFAULT_ICON

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

export function useLearnTopic() {
  const { section = 'beginner', topic = '' } = useParams<{ section: string; topic: string }>()
  const navigate = useNavigate()
  const topicId = Number(topic) || null
  const [filter, setFilter] = useState<FilterType>('전체')
  const [page, setPage] = useState(1)
  const [quizzes, setQuizzes] = useState<QuizItem[]>([])
  const [topicInfo, setTopicInfo] = useState<LearningTopic | null>(null)
  const [questionLoadError, setQuestionLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const sectionLabel = LEVEL_LABEL[section] ?? '학습'
  const meta: TopicMeta = {
    icon: topicId ? get_topic_icon(topicId) : DEFAULT_ICON,
    title: topicInfo?.topicName ?? '학습 콘텐츠',
    desc: topicInfo?.description ?? '',
  }

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setQuestionLoadError('')
      try {
        const levelId = INVESTMENT_LEVEL_ID_MAP[section] ?? 1
        const [topicsRes, questionsRes, historiesRes, wrongRes, bookmarkRes] = await Promise.allSettled([
          api_get_topics(),
          api_get_questions({ topicId: topicId ?? undefined, investmentLevelId: levelId }),
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
        if (topicsRes.status === 'fulfilled') {
          setTopicInfo(topicsRes.value.data.find((t) => t.topicId === topicId) ?? null)
        }
      } catch {
        if (!alive) return
        setQuizzes([])
        setQuestionLoadError('문제 목록 API 연결에 실패했습니다. 로그인 상태와 백엔드 서버를 확인해주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    setPage(1)
    return () => { alive = false }
  }, [topicId, section])

  const filtered = quizzes.filter((q) => {
    if (filter === '전체') return true
    if (filter === '미완료') return q.status !== 'done'
    if (filter === '완료') return q.status === 'done'
    if (filter === '오답') return q.isWrong
    if (filter === '찜') return q.isBookmarked
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handle_filter_change = (next: FilterType) => {
    setFilter(next)
    setPage(1)
  }

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

  return {
    topic, section, meta, sectionLabel, filter, setFilter: handle_filter_change,
    quizzes, filtered, paginated,
    page: currentPage, totalPages, setPage,
    questionLoadError, loading,
    totalDone, wrongCount, correctCount, earned, progressPct, nextQuiz,
    handle_quiz_click,
  }
}
