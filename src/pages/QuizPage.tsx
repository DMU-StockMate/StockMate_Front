import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import Chip, { ChipRow } from '../components/common/Chip'
import {
  api_add_bookmark,
  api_delete_bookmark,
  api_get_bookmarks,
  api_get_question,
  api_get_questions,
  api_submit_answer,
  type QuizChoice,
} from '../api/learning'
import { api_stream_chat_session, api_stream_question_chat } from '../api/ai'

type QuizType = 'multiple' | 'ox'
type AiRole = 'assistant' | 'user'

interface QuizItem {
  id: number
  type: QuizType
  question: string
  options: string[]
  choiceIds: number[]
  correctIndex: number
  tag: string
  difficulty: '쉬움' | '보통' | '어려움'
  reward: number
  explanation: string | null
}

interface AiMessage {
  id: number
  role: AiRole
  text: string
}

const format_type = (type: QuizType) => (type === 'multiple' ? '4지선다' : 'OX')

const as_record = (value: unknown) => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
)

const get_question_id = (raw: unknown) => {
  const item = as_record(raw)
  return Number(item.question_id ?? item.questionId ?? 0)
}

const get_choice_id = (choice: QuizChoice, index: number) => (
  Number(choice.choice_id ?? choice.choiceId ?? choice.id ?? index + 1)
)

const get_question_array = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw
  const item = as_record(raw)
  const nested = item.data ?? item.items ?? item.content ?? item.questions
  return Array.isArray(nested) ? nested : []
}

const normalize_question = (raw: unknown): QuizItem | null => {
  const question = as_record(raw)
  const choices = Array.isArray(question.choices) ? question.choices as QuizChoice[] : []
  const id = get_question_id(question)
  const questionText = String(question.question_text ?? question.questionText ?? '')

  if (!id || !questionText || choices.length === 0) return null

  const typeText = String(question.question_type ?? question.questionType ?? '')
  const levelId = Number(question.investment_level_id ?? question.investmentLevelId ?? 1)
  const correctIndex = choices.findIndex((choice) => choice.is_correct === true || choice.isCorrect === true)

  return {
    id,
    type: typeText === 'OX' ? 'ox' : 'multiple',
    question: questionText,
    options: choices.map((choice, index) => String(choice.choice_text ?? choice.text ?? `선택지 ${index + 1}`)),
    choiceIds: choices.map(get_choice_id),
    correctIndex,
    tag: String(question.topicName ?? question.topic ?? '투자 학습'),
    difficulty: levelId > 2 ? '어려움' : levelId > 1 ? '보통' : '쉬움',
    reward: Number(question.reward_cash ?? question.rewardCash ?? 0),
    explanation: typeof question.explanation === 'string' ? question.explanation : null,
  }
}

const get_ai_intro = (quiz: QuizItem) => (
  `${quiz.id}번 문제를 같이 볼게요.\n\n` +
  `문제: ${quiz.question}\n\n` +
  `이 문제는 ${format_type(quiz.type)} 형식입니다. 헷갈리는 보기를 말해주면 문제 맥락을 기준으로 설명해드릴게요.`
)

export default function QuizPage() {
  const { topicId = 'basic-terms', questionId = '' } = useParams<{ topicId: string; questionId: string }>()
  const navigate = useNavigate()
  const requestedQuestionId = Number.parseInt(questionId, 10)

  const [quiz, setQuiz] = useState<QuizItem | null>(null)
  const [questions, setQuestions] = useState<QuizItem[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ correct: boolean; reward: number; explanation: string | null } | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [aiSessionId, setAiSessionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [aiSending, setAiSending] = useState(false)
  const nextAiMessageIdRef = useRef(1)

  const sync_question = (nextQuiz: QuizItem) => {
    setQuiz(nextQuiz)
    setSelected(null)
    setSubmitted(false)
    setSubmitResult(null)
    setAiOpen(false)
    setAiInput('')
    setAiSessionId(null)
    setAiMessages([{ id: nextAiMessageIdRef.current, role: 'assistant', text: get_ai_intro(nextQuiz) }])
    nextAiMessageIdRef.current += 1
  }

  useEffect(() => {
    let alive = true

    const load_question = async () => {
      setLoading(true)
      setError('')

      try {
        const { data } = await api_get_questions()
        const loaded = get_question_array(data)
          .map(normalize_question)
          .filter((item): item is QuizItem => item !== null)
          .sort((a, b) => a.id - b.id)

        let nextQuiz: QuizItem | null = loaded.find((question) => question.id === requestedQuestionId) ?? null

        if (!nextQuiz && requestedQuestionId > 0) {
          const detail = await api_get_question(requestedQuestionId)
          nextQuiz = normalize_question(detail.data)
        }

        if (!alive) return

        setQuestions(nextQuiz && !loaded.some((item) => item.id === nextQuiz.id)
          ? [...loaded, nextQuiz].sort((a, b) => a.id - b.id)
          : loaded)

        if (nextQuiz) {
          sync_question(nextQuiz)
        } else if (loaded[0]) {
          sync_question(loaded[0])
          navigate(`/learn/quiz/${topicId}/${loaded[0].id}`, { replace: true })
        } else {
          setQuiz(null)
          setAiMessages([])
          setError('표시할 문제가 없습니다. AI 문제 생성 후 다시 시도해주세요.')
        }
      } catch {
        if (!alive) return
        setQuiz(null)
        setQuestions([])
        setAiMessages([])
        setError('문제 API 연결에 실패했습니다. 로그인 상태와 백엔드 서버를 확인해주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load_question()

    return () => {
      alive = false
    }
  }, [questionId, requestedQuestionId, topicId, navigate])

  useEffect(() => {
    if (!quiz) return

    let alive = true

    api_get_bookmarks()
      .then(({ data }) => {
        if (!alive) return
        setBookmarked(data.some((bookmark) => get_question_id(bookmark.question ?? bookmark) === quiz.id))
      })
      .catch(() => {
        if (alive) setBookmarked(false)
      })

    return () => {
      alive = false
    }
  }, [quiz])

  const currentIndex = quiz ? questions.findIndex((question) => question.id === quiz.id) : -1
  const progressPct = Math.round(((currentIndex >= 0 ? currentIndex + 1 : 0) / Math.max(questions.length, 1)) * 100)
  const resultCorrectIndex = quiz?.correctIndex ?? -1
  const isCorrect = submitResult?.correct ?? false
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < questions.length - 1

  const handle_next = () => {
    const nextQuiz = questions[currentIndex + 1]
    if (nextQuiz) {
      sync_question(nextQuiz)
      navigate(`/learn/quiz/${topicId}/${nextQuiz.id}`)
      return
    }
    navigate(`/learn/beginner/${topicId}`)
  }

  const handle_prev = () => {
    const prevQuiz = questions[currentIndex - 1]
    if (!prevQuiz) return
    sync_question(prevQuiz)
    navigate(`/learn/quiz/${topicId}/${prevQuiz.id}`)
  }

  const handle_bookmark_toggle = async () => {
    if (!quiz || bookmarkSaving) return
    setBookmarkSaving(true)

    try {
      if (bookmarked) {
        await api_delete_bookmark(quiz.id)
        setBookmarked(false)
      } else {
        await api_add_bookmark(quiz.id)
        setBookmarked(true)
      }
    } catch {
      setError('북마크 처리에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setBookmarkSaving(false)
    }
  }

  const handle_submit = async () => {
    if (!quiz || selected === null) return
    const selectedChoiceId = quiz.choiceIds[selected]
    if (!selectedChoiceId) return

    setSubmitting(true)
    setError('')
    try {
      const { data } = await api_submit_answer(quiz.id, selectedChoiceId)
      setSubmitResult({
        correct: data.correct,
        reward: data.reward,
        explanation: data.explanation,
      })
      setSubmitted(true)
    } catch {
      setError('정답 제출에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const send_ai_message = async (text: string) => {
    if (!quiz) return

    const value = text.trim()
    if (!value || aiSending) return

    const userMessage: AiMessage = { id: nextAiMessageIdRef.current, role: 'user', text: value }
    nextAiMessageIdRef.current += 1
    const assistantId = nextAiMessageIdRef.current
    const assistantMessage: AiMessage = { id: assistantId, role: 'assistant', text: '' }
    nextAiMessageIdRef.current += 1

    setAiMessages((prev) => [...prev, userMessage, assistantMessage])
    setAiInput('')
    setAiSending(true)

    try {
      const onEvent = (event: { type: string; sessionId?: number; content?: string }) => {
        if (event.type === 'session' && event.sessionId) setAiSessionId(event.sessionId)
        if (event.type === 'done' && event.sessionId) setAiSessionId(event.sessionId)
        if (event.type !== 'token') return

        setAiMessages((prev) => prev.map((message) => (
          message.id === assistantId
            ? { ...message, text: `${message.text}${event.content ?? ''}` }
            : message
        )))
      }

      if (aiSessionId) {
        await api_stream_chat_session(aiSessionId, value, onEvent)
      } else {
        await api_stream_question_chat(quiz.id, value, onEvent)
      }
    } catch {
      setAiMessages((prev) => prev.map((message) => (
        message.id === assistantId
          ? { ...message, text: 'AI 설명 API 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' }
          : message
      )))
    } finally {
      setAiSending(false)
    }
  }

  const handle_ai_key_down = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send_ai_message(aiInput)
    }
  }

  if (!quiz) {
    return (
      <AppLayout topbarPlaceholder="학습 검색">
        <div className="breadcrumb">
          <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
          <span className="bc-sep">›</span>
          <span className="bc-current">문제</span>
        </div>
        <Card className="card-lg">
          <div className="section-title">{loading ? '문제를 불러오는 중입니다.' : '문제를 표시할 수 없습니다.'}</div>
          <div className="muted" style={{ marginTop: 8 }}>{loading ? '백엔드 문제 API를 확인하고 있습니다.' : error}</div>
          {!loading && (
            <div style={{ marginTop: 18 }}>
              <Button onClick={() => navigate(`/learn/beginner/${topicId}`)}>
                문제 목록으로 이동
              </Button>
            </div>
          )}
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className={`quiz-study-shell ${aiOpen ? 'with-ai' : ''}`}>
        <section className="quiz-study-main">
          <div className="breadcrumb">
            <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
            <span className="bc-sep">›</span>
            <span className="bc-link" onClick={() => navigate('/learn/beginner')}>초급</span>
            <span className="bc-sep">›</span>
            <span className="bc-link" onClick={() => navigate(`/learn/beginner/${topicId}`)}>문제 목록</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">Q{quiz.id}</span>
          </div>

          {(loading || error) && (
            <div className="ai-block" style={{ marginBottom: 18 }}>
              <span className="ai-tag">{loading ? '불러오는 중' : '알림'}</span>
              <span style={{ fontSize: 14 }}>{loading ? '문제 데이터를 확인하고 있습니다.' : error}</span>
            </div>
          )}

          <div className="quiz-top-row">
            <button
              className="quiz-icon-button"
              onClick={() => navigate(`/learn/beginner/${topicId}`)}
              aria-label="문제 나가기"
            >
              <i className="bi bi-x-lg" />
            </button>
            <div className="quiz-progress-wrap">
              <div className="row" style={{ marginBottom: 8, fontSize: 13, color: 'var(--t2)' }}>
                <span>문제 풀이 · Q{currentIndex >= 0 ? currentIndex + 1 : quiz.id} / {questions.length}</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} />
            </div>
            <button
              className="quiz-icon-button"
              onClick={() => void handle_bookmark_toggle()}
              aria-label="문제 찜하기"
              disabled={bookmarkSaving}
            >
              <i className={`bi ${bookmarked ? 'bi-heart-fill' : 'bi-heart'}`} style={{ color: bookmarked ? 'var(--up)' : undefined }} />
            </button>
          </div>

          {submitted && (
            <div className={`result-banner ${isCorrect ? 'correct' : 'wrong'}`} style={{ marginBottom: 18 }}>
              <div className="icon-circle">
                <i className={`bi ${isCorrect ? 'bi-check-lg' : 'bi-x-lg'}`} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{isCorrect ? '정답입니다!' : '오답입니다.'}</div>
                <div style={{ marginTop: 4 }}>
                  {isCorrect ? `+${(submitResult?.reward ?? quiz.reward).toLocaleString()}원 획득` : 'AI 설명으로 헷갈린 개념을 바로 확인해보세요.'}
                </div>
              </div>
              <Button variant="outline" onClick={() => setAiOpen(true)}>
                <i className="bi bi-stars" />
                AI 설명
              </Button>
            </div>
          )}

          <Card className="card-lg quiz-question-card">
            <ChipRow style={{ marginBottom: 20 }}>
              <Chip active>{quiz.tag}</Chip>
              <Chip>{format_type(quiz.type)}</Chip>
              <Chip>난이도 · {quiz.difficulty}</Chip>
              <span
                className="chip"
                style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'transparent' }}
              >
                +{quiz.reward.toLocaleString()}원
              </span>
            </ChipRow>

            <div className="quiz-type-label">{format_type(quiz.type)} 문제</div>
            <h2 className="quiz-question-title">{quiz.question}</h2>

            <div className={quiz.type === 'ox' ? 'quiz-ox-options' : ''}>
              {quiz.options.map((option, index) => {
                let optionClass = 'opt'
                if (submitted) {
                  if (resultCorrectIndex >= 0 && index === resultCorrectIndex) optionClass += ' correct'
                  else if (index === selected) optionClass += isCorrect ? ' correct' : ' wrong'
                } else if (index === selected) {
                  optionClass += ' selected'
                }

                return (
                  <button
                    key={quiz.choiceIds[index] ?? option}
                    className={optionClass}
                    onClick={() => !submitted && setSelected(index)}
                    disabled={submitted}
                  >
                    <span className="num">{quiz.type === 'ox' ? option : index + 1}</span>
                    <span>{option}</span>
                  </button>
                )
              })}
            </div>

            {!submitted ? (
              <div className="quiz-bottom-actions">
                <div className="quiz-step-nav">
                  <button onClick={handle_prev} disabled={!hasPrev}>
                    <i className="bi bi-chevron-left" />
                    이전
                  </button>
                  <button onClick={handle_next} disabled={!hasNext}>
                    다음
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
                <div className="quiz-submit-actions">
                  <Button variant="outline" onClick={() => setAiOpen(true)}>
                    <i className="bi bi-stars" />
                    AI 설명
                  </Button>
                  <Button size="lg" style={{ minWidth: 200 }} onClick={handle_submit} disabled={selected === null || submitting}>
                    {submitting ? '제출 중...' : '제출하기'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="ai-block" style={{ marginTop: 24 }}>
                  <span className="ai-tag">해설</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {submitResult?.explanation ?? quiz.explanation ?? '등록된 해설이 없습니다.'}
                  </span>
                </div>

                <div className="quiz-bottom-actions">
                  <div className="quiz-step-nav">
                    <button onClick={handle_prev} disabled={!hasPrev}>
                      <i className="bi bi-chevron-left" />
                      이전
                    </button>
                    <button onClick={handle_next}>
                      {!hasNext ? '완료' : '다음'}
                      <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                  <div className="quiz-submit-actions">
                    <Button variant="outline" onClick={() => setAiOpen(true)}>
                      <i className="bi bi-stars" />
                      AI 설명
                    </Button>
                    <Button size="lg" style={{ minWidth: 200 }} onClick={handle_next}>
                      {!hasNext ? '완료하기' : '다음 문제'}
                      <i className="bi bi-arrow-right" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </section>

        <aside className={`quiz-ai-panel ${aiOpen ? 'open' : ''}`} aria-label="문제 AI 설명 채팅" aria-hidden={!aiOpen}>
          <header className="quiz-ai-header">
            <div>
              <div className="quiz-ai-title">AI 설명</div>
              <div className="quiz-ai-sub">Q{quiz.id} · {format_type(quiz.type)}</div>
            </div>
            <button onClick={() => setAiOpen(false)} aria-label="AI 설명 닫기">
              <i className="bi bi-x-lg" />
            </button>
          </header>

          <div className="quiz-ai-context">
            <span className="pill">문제 맥락</span>
            <p>{quiz.question}</p>
          </div>

          <div className="quiz-ai-messages">
            {aiMessages.map((message) => (
              <div key={message.id} className={`quiz-ai-message ${message.role}`}>
                {message.text.split('\n').map((line, index) => (
                  <span key={`${message.id}-${index}`}>{line || '\u00A0'}</span>
                ))}
              </div>
            ))}
          </div>

          <footer className="quiz-ai-composer">
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={handle_ai_key_down}
              placeholder="이 문제에 대해 질문하기"
              rows={2}
            />
            <button onClick={() => void send_ai_message(aiInput)} aria-label="AI에게 보내기" disabled={aiSending}>
              <i className="bi bi-send-fill" />
            </button>
          </footer>
        </aside>
      </div>
    </AppLayout>
  )
}
