import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api_delete_bookmark, api_get_bookmarks, type QuizBookmark } from '../api/learning'
import { as_record, get_array } from '../utils/normalize'

export type BookmarkSortType = '최신순' | '난이도순'

const DIFFICULTY_ORDER = { '쉬움': 1, '보통': 2, '어려움': 3 } as const

export const get_bookmark_question_id = (bookmark: QuizBookmark) =>
  Number(bookmark.question_id ?? bookmark.questionId ?? bookmark.question?.question_id ?? bookmark.question?.questionId ?? 0)

export const get_bookmark_question_text = (bookmark: QuizBookmark) =>
  String(bookmark.question?.question_text ?? bookmark.question?.questionText ?? '')

export const get_bookmark_topic_slug = (bookmark: QuizBookmark) =>
  String(Number(as_record(bookmark.question).category_id ?? as_record(bookmark.question).categoryId ?? as_record(bookmark.question).topic_id ?? as_record(bookmark.question).topicId ?? 0) || 1)

export const get_bookmark_question_type = (bookmark: QuizBookmark) =>
  String(bookmark.question?.question_type ?? bookmark.question?.questionType ?? 'MULTIPLE_CHOICE')

export const get_bookmark_level_id = (bookmark: QuizBookmark) =>
  Number(bookmark.question?.investment_level_id ?? bookmark.question?.investmentLevelId ?? 1)

export const get_bookmark_difficulty = (levelId: number): '쉬움' | '보통' | '어려움' => {
  if (levelId > 2) return '어려움'
  if (levelId > 1) return '보통'
  return '쉬움'
}

export const get_bookmark_reward = (bookmark: QuizBookmark) =>
  Number(bookmark.question?.reward_cash ?? bookmark.question?.rewardCash ?? 0)

const get_created_at = (bookmark: QuizBookmark) =>
  String(bookmark.created_at ?? bookmark.createdAt ?? '')

export function useBookmarks() {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<QuizBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [sort, setSort] = useState<BookmarkSortType>('최신순')

  useEffect(() => {
    let alive = true
    setLoading(true)
    api_get_bookmarks()
      .then(({ data }) => { if (alive) setBookmarks(get_array(data) as QuizBookmark[]) })
      .catch(() => { if (alive) setError('찜한 문제 목록을 불러오지 못했습니다.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const handle_remove = async (bookmark: QuizBookmark, e: React.MouseEvent) => {
    e.stopPropagation()
    const questionId = get_bookmark_question_id(bookmark)
    if (!questionId || removingId === questionId) return
    setRemovingId(questionId)
    setError('')
    try {
      await api_delete_bookmark(questionId)
      setBookmarks((prev) => prev.filter((b) => get_bookmark_question_id(b) !== questionId))
    } catch {
      setError('찜 해제에 실패했습니다.')
    } finally {
      setRemovingId(null)
    }
  }

  const handle_quiz_click = (bookmark: QuizBookmark) => {
    const questionId = get_bookmark_question_id(bookmark)
    const topicSlug = get_bookmark_topic_slug(bookmark)
    if (!questionId) return
    navigate(`/learn/quiz/${topicSlug}/${questionId}`)
  }

  const sorted = [...bookmarks].sort((a, b) => {
    if (sort === '난이도순') {
      const da = DIFFICULTY_ORDER[get_bookmark_difficulty(get_bookmark_level_id(a))]
      const db = DIFFICULTY_ORDER[get_bookmark_difficulty(get_bookmark_level_id(b))]
      return da - db
    }
    return get_created_at(b).localeCompare(get_created_at(a))
  })

  return {
    bookmarks, sorted, loading, error, removingId, sort, setSort,
    handle_remove, handle_quiz_click,
  }
}
