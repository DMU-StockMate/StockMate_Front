import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  api_get_histories,
  api_get_questions,
  api_get_statistics,
  api_get_topics,
  type LearningStatistics,
  type QuizAttempt,
} from '../api/learning'
import { as_record, get_array } from '../utils/normalize'
import { get_topic_icon, INVESTMENT_LEVEL_ID_MAP } from './useLearnTopic'

interface BackendQuestionItem {
  id: number
  topicId: number | null
  question: string
  type: string
  reward: number
  solved: boolean
}

interface TopicData {
  id: number
  icon: string
  title: string
  desc: string
  count: number
  solvedCount: number
  status: 'active' | 'not-started'
}

type FilterType = '전체' | '진행 중' | '미시작'

export const LEVEL_META: Record<string, { badge: string; badgeBg: string; title: string; sub: string }> = {
  beginner: { badge: '초', badgeBg: '#10B981', title: '초급 학습', sub: '투자 입문자를 위한 기초 과정' },
  intermediate: { badge: '중', badgeBg: '#3B82F6', title: '중급 학습', sub: '핵심 지표 분석과 실전 투자' },
  advanced: { badge: '고', badgeBg: '#6D29D9', title: '고급 학습', sub: '심화된 전략과 고급 분석' },
}

const get_question_id = (raw: unknown) => {
  const item = as_record(raw)
  return Number(item.question_id ?? item.questionId ?? 0)
}

const get_attempt_question_id = (attempt: QuizAttempt) =>
  Number(attempt.question_id ?? attempt.questionId ?? attempt.question?.question_id ?? attempt.question?.questionId ?? 0)

const normalize_backend_question = (raw: unknown, solvedIds: Set<number>): BackendQuestionItem | null => {
  const item = as_record(raw)
  const id = get_question_id(item)
  const question = String(item.question_text ?? item.questionText ?? '')
  if (!id || !question) return null
  return {
    id,
    topicId: Number(item.topic_id ?? item.topicId ?? 0) || null,
    question,
    type: String(item.question_type ?? item.questionType ?? 'MULTIPLE_CHOICE'),
    reward: Number(item.reward_cash ?? item.rewardCash ?? 0),
    solved: solvedIds.has(id),
  }
}

export function useLearnLevel() {
  const { section = 'beginner' } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('전체')
  const [backendQuestions, setBackendQuestions] = useState<BackendQuestionItem[]>([])
  const [topicList, setTopicList] = useState<{ id: number; title: string; desc: string }[]>([])
  const [stats, setStats] = useState<LearningStatistics | null>(null)
  const [questionLoadError, setQuestionLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const meta = LEVEL_META[section] ?? LEVEL_META.beginner

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setQuestionLoadError('')
      try {
        const levelId = INVESTMENT_LEVEL_ID_MAP[section] ?? 1
        const [topicsRes, questionsRes, historiesRes, statsRes] = await Promise.allSettled([
          api_get_topics(),
          api_get_questions({ investmentLevelId: levelId }),
          api_get_histories(),
          api_get_statistics(),
        ])
        if (questionsRes.status !== 'fulfilled') throw new Error('question load failed')

        const solvedIds = new Set(
          historiesRes.status === 'fulfilled'
            ? (get_array(historiesRes.value.data) as QuizAttempt[]).map(get_attempt_question_id).filter((id) => id > 0)
            : [],
        )

        const questions = get_array(questionsRes.value.data)
          .map((item) => normalize_backend_question(item, solvedIds))
          .filter((item): item is BackendQuestionItem => item !== null)
          .sort((a, b) => a.id - b.id)

        if (!alive) return
        setBackendQuestions(questions)
        if (topicsRes.status === 'fulfilled') {
          setTopicList(topicsRes.value.data.map((t) => ({ id: t.topicId, title: t.topicName, desc: t.description ?? '' })))
        }
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      } catch {
        if (!alive) return
        setBackendQuestions([])
        setQuestionLoadError('문제 목록 API 연결에 실패했습니다. 로그인 상태와 백엔드 서버를 확인해주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [section])

  // 카테고리는 문제가 실제로 등록된 것만 보여준다 (learning_topics에는 아직 문제가 없는 항목도 있을 수 있음).
  const topics: TopicData[] = useMemo(() => topicList
    .map((t) => {
      const questions = backendQuestions.filter((q) => q.topicId === t.id)
      const topicSolvedCount = questions.filter((q) => q.solved).length
      return {
        id: t.id,
        icon: get_topic_icon(t.id),
        title: t.title,
        desc: t.desc,
        count: questions.length,
        solvedCount: topicSolvedCount,
        status: topicSolvedCount > 0 ? 'active' as const : 'not-started' as const,
      }
    })
    .filter((t) => t.count > 0),
  [backendQuestions, topicList])

  const filteredTopics = topics.filter((t) => {
    if (filter === '전체') return true
    if (filter === '진행 중') return t.status === 'active'
    if (filter === '미시작') return t.status === 'not-started'
    return true
  })

  const solvedCount = useMemo(() => backendQuestions.filter((q) => q.solved).length, [backendQuestions])
  const progressPct = Math.round((solvedCount / Math.max(backendQuestions.length, 1)) * 100)
  const earned = useMemo(
    () => backendQuestions.filter((q) => q.solved).reduce((sum, q) => sum + q.reward, 0),
    [backendQuestions],
  )

  const handle_topic_click = (topic: TopicData) => navigate(`/learn/${section}/${topic.id}`)

  return {
    section, meta, filter, setFilter,
    backendQuestions, filteredTopics,
    stats, questionLoadError, loading,
    solvedCount, progressPct, earned,
    handle_topic_click,
  }
}
