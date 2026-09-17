import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import { api_get_histories, type QuizAttempt } from '../api/learning'
import { get_array } from '../utils/normalize'
import {
  get_attempt_question_text,
  get_attempt_reward,
  get_attempt_time,
} from '../hooks/useLearnPage'

const PAGE_SIZE = 10

const get_question_id = (attempt: QuizAttempt) =>
  Number(attempt.question_id ?? attempt.questionId ?? attempt.question?.question_id ?? attempt.question?.questionId ?? 0)

const get_topic_id = (attempt: QuizAttempt) =>
  Number(attempt.question?.category_id ?? attempt.question?.categoryId ?? attempt.question?.topic_id ?? attempt.question?.topicId ?? 1)

const format_time = (value: string) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR')
}

export default function LearnHistoryPage() {
  const navigate = useNavigate()
  const [histories, setHistories] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api_get_histories()
      .then(({ data }) => {
        if (alive) setHistories(get_array(data) as QuizAttempt[])
      })
      .catch(() => {
        if (alive) setError('학습 기록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [])

  const totalReward = useMemo(
    () => histories.reduce((sum, item) => sum + get_attempt_reward(item), 0),
    [histories],
  )
  const correctCount = histories.filter((item) => item.is_correct ?? item.isCorrect).length
  const wrongCount = histories.length - correctCount
  const totalPages = Math.max(1, Math.ceil(histories.length / PAGE_SIZE))
  const pagedHistories = histories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const open_quiz = (attempt: QuizAttempt) => {
    const questionId = get_question_id(attempt)
    if (!questionId) return
    navigate(`/learn/quiz/${get_topic_id(attempt)}/${questionId}`)
  }

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">학습 기록</span>
      </div>

      <div className="page-title">
        <div>
          <h1>학습 기록</h1>
          <div className="page-sub">풀었던 문제와 획득 보상을 한 번에 확인하세요</div>
        </div>
        <Button variant="outline" onClick={() => navigate('/learn')}>
          <i className="bi bi-arrow-left" />
          학습으로
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        <Card>
          <div className="muted" style={{ fontSize: 12 }}>총 획득 보상</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{totalReward.toLocaleString()}원</div>
        </Card>
        <Card>
          <div className="muted" style={{ fontSize: 12 }}>풀이 기록</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{histories.length.toLocaleString()}문제</div>
        </Card>
        <Card>
          <div className="muted" style={{ fontSize: 12 }}>정답 / 오답</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{correctCount} / {wrongCount}</div>
        </Card>
      </div>

      <Card>
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>전체 기록</div>
          <span className="muted" style={{ fontSize: 12 }}>{histories.length}건</span>
        </div>

        {loading && <div className="muted">학습 기록을 불러오는 중입니다.</div>}
        {!loading && error && <div className="muted">{error}</div>}
        {!loading && !error && histories.length === 0 && <div className="muted">아직 학습 기록이 없습니다.</div>}
        {!loading && !error && pagedHistories.map((item) => {
          const correct = item.is_correct ?? item.isCorrect ?? false
          const reward = get_attempt_reward(item)
          return (
            <button
              key={`${get_question_id(item)}-${get_attempt_time(item)}`}
              className="activity-row"
              style={{ width: '100%', background: 'transparent', borderLeft: 0, borderRight: 0, borderTop: 0, cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => open_quiz(item)}
            >
              <span className="left" style={{ minWidth: 0 }}>
                <Pill variant={correct ? 'success' : 'warning'}>{correct ? '정답' : '오답'}</Pill>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {get_attempt_question_text(item)}
                </span>
              </span>
              <span className="muted" style={{ fontSize: 12, textAlign: 'right', flexShrink: 0 }}>
                {format_time(get_attempt_time(item))}
                {reward > 0 ? ` · +${reward.toLocaleString()}원` : ''}
              </span>
            </button>
          )
        })}

        {!loading && !error && totalPages > 1 && (
          <div className="quiz-step-nav" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
              <i className="bi bi-chevron-left" />
              이전
            </button>
            <span className="muted" style={{ fontSize: 12, fontWeight: 800, padding: '0 8px' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
              다음
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
