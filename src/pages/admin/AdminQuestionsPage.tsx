import { useCallback, useEffect, useMemo, useState } from 'react'
import { api_generate_from_prompt } from '../../api/ai'
import {
  api_admin_get_question_candidates,
  api_admin_get_question_quality_summary,
  api_admin_recalculate_question_quality,
  api_admin_update_question_review_status,
  type AdminQuestionCandidate,
  type AdminQuestionReviewStatus,
  type AdminQuestionQualitySummary,
} from '../../api/admin'
import { api_get_topics, type LearningTopic } from '../../api/learning'
import AdminLayout from './AdminLayout'

const LEVELS = [
  { id: 1, label: '초급', key: 'beginner' },
  { id: 2, label: '중급', key: 'intermediate' },
  { id: 3, label: '고급', key: 'advanced' },
] as const

const REVIEW_LABELS: Record<AdminQuestionReviewStatus, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'var(--warning)' },
  ACTIVE: { label: '활성', color: 'var(--success)' },
  INACTIVE: { label: '비활성', color: 'var(--t3)' },
  REJECTED: { label: '반려', color: 'var(--up)' },
  REVIEW_REQUIRED: { label: '검수 필요', color: 'var(--primary)' },
}

type LevelCountKey = typeof LEVELS[number]['key']

const get_error_message = (err: any, fallback: string) =>
  err?.response?.data?.message ?? err?.message ?? fallback

export default function AdminQuestionsPage() {
  const [summary, setSummary] = useState<AdminQuestionQualitySummary | null>(null)
  const [questions, setQuestions] = useState<AdminQuestionCandidate[]>([])
  const [topics, setTopics] = useState<LearningTopic[]>([])
  const [reviewStatus, setReviewStatus] = useState<AdminQuestionReviewStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [prompt, setPrompt] = useState('투자자가 반드시 알아야 할 핵심 개념을 확인하는 문제를 만들어줘')
  const [topicId, setTopicId] = useState<number | ''>('')
  const [questionType, setQuestionType] = useState<'MULTIPLE_CHOICE' | 'OX'>('MULTIPLE_CHOICE')
  const [counts, setCounts] = useState<Record<LevelCountKey, number>>({
    beginner: 1,
    intermediate: 1,
    advanced: 1,
  })

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api_admin_get_question_quality_summary(),
      api_admin_get_question_candidates({
        reviewStatus: reviewStatus === 'ALL' ? undefined : reviewStatus,
        page,
        limit: 20,
      }),
      api_get_topics(),
    ])
      .then(([summaryRes, candidatesRes, topicsRes]) => {
        setSummary(summaryRes.data)
        setQuestions(candidatesRes.data.items)
        setTotal(candidatesRes.data.meta.total)
        setTotalPages(Math.max(1, candidatesRes.data.meta.totalPages))
        setTopics(topicsRes.data)
        if (!topicId) setTopicId(topicsRes.data[0]?.topicId ?? '')
      })
      .catch((err) => setMessage(get_error_message(err, '문제 목록을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [page, reviewStatus, topicId])

  useEffect(() => { load() }, [load])

  const handle_review_status = async (questionId: number, status: AdminQuestionReviewStatus) => {
    setActionLoading(questionId)
    setMessage('')
    try {
      const { data } = await api_admin_update_question_review_status(questionId, status)
      setMessage(data.warning ?? '검수 상태가 변경되었습니다.')
      load()
    } catch (err: any) {
      setMessage(get_error_message(err, '검수 상태 변경에 실패했습니다.'))
    } finally {
      setActionLoading(null)
    }
  }

  const handle_recalculate = async (questionId: number) => {
    setActionLoading(questionId)
    setMessage('')
    try {
      await api_admin_recalculate_question_quality(questionId)
      setMessage('품질 점수를 다시 계산했습니다.')
      load()
    } catch (err: any) {
      setMessage(get_error_message(err, '품질 점수 재계산에 실패했습니다.'))
    } finally {
      setActionLoading(null)
    }
  }

  const handle_generate = async () => {
    if (!topicId) {
      setMessage('생성할 주제를 선택해주세요.')
      return
    }

    const targets = LEVELS.filter((level) => counts[level.key] > 0)
    if (targets.length === 0) {
      setMessage('생성할 문제 수를 입력해주세요.')
      return
    }

    setGenerateLoading(true)
    setMessage('')
    try {
      const results = await Promise.all(targets.map((level) =>
        api_generate_from_prompt({
          prompt,
          topicId: Number(topicId),
          investmentLevelId: level.id,
          questionType,
          count: counts[level.key],
        }),
      ))
      const created = results.reduce((sum, res) => sum + res.data.questions.length, 0)
      setMessage(`문제 ${created}개가 생성되었습니다.`)
      setReviewStatus('PENDING')
      setPage(1)
      load()
    } catch (err: any) {
      setMessage(get_error_message(err, '문제 생성에 실패했습니다.'))
    } finally {
      setGenerateLoading(false)
    }
  }

  const statusCards = useMemo(
    () => summary ? (Object.entries(REVIEW_LABELS) as [AdminQuestionReviewStatus, typeof REVIEW_LABELS[AdminQuestionReviewStatus]][]).map(([status, info]) => ({
      status,
      ...info,
      count: summary.reviewStatusCounts[status] ?? 0,
    })) : [],
    [summary],
  )

  return (
    <AdminLayout title="문제 관리">
      <div style={{ maxWidth: 1200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>문제 관리</h2>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>전체 {total.toLocaleString()}개 문제</p>
          </div>
          <select
            value={reviewStatus}
            onChange={(e) => { setReviewStatus(e.target.value as AdminQuestionReviewStatus | 'ALL'); setPage(1) }}
            style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff' }}
          >
            <option value="ALL">전체 상태</option>
            {Object.entries(REVIEW_LABELS).map(([status, info]) => (
              <option key={status} value={status}>{info.label}</option>
            ))}
          </select>
        </div>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>전체</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{summary.totalQuestions.toLocaleString()}</div>
            </div>
            {statusCards.map((item) => (
              <div key={item.status} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: item.color, fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{item.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>AI 문제 생성</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 150px', gap: 10, marginBottom: 10 }}>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              minLength={5}
              maxLength={1000}
              placeholder="생성 프롬프트"
              style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)' }}
            />
            <select
              value={topicId}
              onChange={(e) => setTopicId(Number(e.target.value))}
              style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff' }}
            >
              {topics.map((topic) => (
                <option key={topic.topicId} value={topic.topicId}>{topic.topicName}</option>
              ))}
            </select>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as 'MULTIPLE_CHOICE' | 'OX')}
              style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff' }}
            >
              <option value="MULTIPLE_CHOICE">객관식</option>
              <option value="OX">OX</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {LEVELS.map((level) => (
              <label key={level.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t2)' }}>
                {level.label}
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={counts[level.key]}
                  onChange={(e) => setCounts((prev) => ({ ...prev, [level.key]: Math.max(0, Math.min(10, Number(e.target.value) || 0)) }))}
                  style={{ width: 72, height: 36, padding: '0 10px', borderRadius: 9, border: '1.5px solid var(--border)' }}
                />
              </label>
            ))}
            <button
              onClick={handle_generate}
              disabled={generateLoading}
              style={{
                height: 38, padding: '0 16px', borderRadius: 10, border: 'none',
                background: 'var(--primary)', color: '#fff', fontWeight: 700,
                cursor: generateLoading ? 'not-allowed' : 'pointer', opacity: generateLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <i className={`bi ${generateLoading ? 'bi-arrow-repeat' : 'bi-plus-circle'}`} />
              {generateLoading ? '생성 중...' : '새 문제 생성'}
            </button>
          </div>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: '#F8FAFC', border: '1px solid var(--border)', color: 'var(--t2)' }}>
            {message}
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>불러오는 중...</div>
          ) : questions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>표시할 문제가 없습니다.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>문제</th>
                  <th style={thStyle}>분류</th>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>품질</th>
                  <th style={thStyle}>관리</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => {
                  const review = REVIEW_LABELS[question.reviewStatus]
                  return (
                    <tr key={question.questionId} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={tdStyle}>Q{question.questionId}</td>
                      <td style={{ ...tdStyle, maxWidth: 430 }}>
                        <div style={{ fontWeight: 700, color: 'var(--t1)', lineHeight: 1.45 }}>{question.questionText}</div>
                        <div style={{ color: 'var(--t3)', marginTop: 6 }}>{question.reason}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{question.category?.categoryName ?? '-'}</div>
                        <div style={{ color: 'var(--t3)', marginTop: 4 }}>{question.detail?.detailName ?? '-'}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: review.color, fontWeight: 800 }}>{review.label}</span>
                      </td>
                      <td style={tdStyle}>
                        <div>최종 {question.finalQualityScore ?? '-'}</div>
                        <div style={{ color: 'var(--t3)', marginTop: 4 }}>AI {question.aiQualityScore ?? '-'} · 유사도 {question.similarityScore ?? '-'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button style={smallButtonStyle} disabled={actionLoading === question.questionId} onClick={() => handle_review_status(question.questionId, 'ACTIVE')}>활성</button>
                          <button style={smallButtonStyle} disabled={actionLoading === question.questionId} onClick={() => handle_review_status(question.questionId, 'REJECTED')}>반려</button>
                          <button style={smallButtonStyle} disabled={actionLoading === question.questionId} onClick={() => handle_recalculate(question.questionId)}>재계산</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <button style={pageButtonStyle} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</button>
          <span style={{ fontSize: 13, color: 'var(--t2)' }}>{page} / {totalPages}</span>
          <button style={pageButtonStyle} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</button>
        </div>
      </div>
    </AdminLayout>
  )
}

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left' as const,
  color: 'var(--t2)',
  fontWeight: 700,
}

const tdStyle = {
  padding: '14px',
  verticalAlign: 'top' as const,
  color: 'var(--t2)',
}

const smallButtonStyle = {
  height: 30,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: '#fff',
  color: 'var(--t2)',
  fontWeight: 700,
  cursor: 'pointer',
}

const pageButtonStyle = {
  height: 34,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: '#fff',
  color: 'var(--t2)',
  cursor: 'pointer',
}
