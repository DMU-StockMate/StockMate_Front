import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api_get_bookmarks,
  api_get_histories,
  api_get_questions,
  api_get_statistics,
  type LearningStatistics,
  type QuizAttempt,
  type QuizBookmark,
  type QuizQuestion,
} from '../api/learning'
import { as_record, get_array } from '../utils/normalize'
import { calc_streak_days } from '../utils/streak'

export const get_attempt_question_text = (attempt: QuizAttempt) =>
  String(attempt.question?.question_text ?? attempt.question?.questionText ?? `Q${attempt.question_id ?? attempt.questionId ?? ''}`)

export const get_attempt_time = (attempt: QuizAttempt) =>
  String(attempt.solved_at ?? attempt.solvedAt ?? '')

export const get_attempt_reward = (attempt: QuizAttempt) =>
  Number(attempt.reward_cash_earned ?? attempt.rewardCashEarned ?? 0)

export const get_bookmark_question_id = (bookmark: QuizBookmark) =>
  Number(bookmark.question_id ?? bookmark.questionId ?? bookmark.question?.question_id ?? bookmark.question?.questionId ?? 0)

export const get_bookmark_question_text = (bookmark: QuizBookmark) =>
  String(bookmark.question?.question_text ?? bookmark.question?.questionText ?? '')

export const get_bookmark_topic_slug = (bookmark: QuizBookmark) =>
  String(Number(as_record(bookmark.question).topic_id ?? as_record(bookmark.question).topicId ?? 0) || 1)

export function useLearnPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<LearningStatistics | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [histories, setHistories] = useState<QuizAttempt[]>([])
  const [bookmarks, setBookmarks] = useState<QuizBookmark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      try {
        const [statsRes, questionsRes, historiesRes, bookmarksRes] = await Promise.allSettled([
          api_get_statistics(),
          api_get_questions(),
          api_get_histories(),
          api_get_bookmarks(),
        ])
        if (!alive) return
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
        if (questionsRes.status === 'fulfilled') setQuestions(get_array(questionsRes.value.data) as QuizQuestion[])
        if (historiesRes.status === 'fulfilled') setHistories(get_array(historiesRes.value.data) as QuizAttempt[])
        if (bookmarksRes.status === 'fulfilled') setBookmarks(get_array(bookmarksRes.value.data) as QuizBookmark[])
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  const recentHistories = useMemo(() => histories.slice(0, 3), [histories])
  const accuracy = stats?.accuracy ?? 0
  const progressValue = Math.min(100, accuracy)
  const remainingForNextLevel = Math.max(0, 50 - (stats?.correct ?? 0))
  const streakDays = useMemo(() => calc_streak_days(histories), [histories])

  const questionCount = questions.length
  const levelQuestionCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    questions.forEach((q) => {
      const levelId = Number(q.investment_level_id ?? q.investmentLevelId ?? 0)
      if (!levelId) return
      counts[levelId] = (counts[levelId] ?? 0) + 1
    })
    return counts
  }, [questions])

  const handle_navigate_bookmark = (bookmark: QuizBookmark) => {
    const questionId = get_bookmark_question_id(bookmark)
    const topicSlug = get_bookmark_topic_slug(bookmark)
    if (!questionId) return
    navigate(`/learn/quiz/${topicSlug}/${questionId}`)
  }

  return {
    stats, questionCount, levelQuestionCounts, histories, bookmarks,
    recentHistories, loading, accuracy, progressValue, remainingForNextLevel, streakDays,
    handle_navigate_bookmark,
  }
}
