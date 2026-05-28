import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import Chip, { ChipRow } from '../components/common/Chip'

type QuizType = 'multiple' | 'ox'
type AiRole = 'assistant' | 'user'

interface MockQuizQuestion {
  id: number
  type: QuizType
  question: string
  options: string[]
  correctIndex: number
  tag: string
  difficulty: '쉬움' | '보통'
  reward: number
  explanation: string
}

interface AiMessage {
  id: number
  role: AiRole
  text: string
}

const MOCK_QUESTIONS: MockQuizQuestion[] = [
  {
    id: 1,
    type: 'multiple',
    question: 'PER(Price-Earnings Ratio)이 의미하는 것은 무엇입니까?',
    options: [
      '주가를 주당순이익(EPS)으로 나눈 비율',
      '주가를 주당순자산(BPS)으로 나눈 비율',
      '영업이익을 매출액으로 나눈 비율',
      '당기순이익을 자기자본으로 나눈 비율',
    ],
    correctIndex: 0,
    tag: '기초 용어',
    difficulty: '쉬움',
    reward: 500,
    explanation: 'PER은 현재 주가가 주당순이익의 몇 배인지 보여주는 지표입니다. 예를 들어 주가가 50,000원이고 EPS가 5,000원이면 PER은 10배입니다.',
  },
  {
    id: 2,
    type: 'ox',
    question: 'PER이 낮으면 항상 좋은 투자 대상이라고 볼 수 있다.',
    options: ['O', 'X'],
    correctIndex: 1,
    tag: '기초 용어',
    difficulty: '쉬움',
    reward: 500,
    explanation: 'PER이 낮아도 성장성이 낮거나 이익이 일시적으로 높아진 기업일 수 있습니다. 업종 평균, 이익의 지속성, 미래 성장성을 함께 봐야 합니다.',
  },
  {
    id: 3,
    type: 'multiple',
    question: 'PBR(Price Book-value Ratio)을 계산할 때 사용하는 기준은 무엇입니까?',
    options: [
      '주가와 주당순자산(BPS)',
      '주가와 주당순이익(EPS)',
      '매출액과 영업이익',
      '배당금과 시가총액',
    ],
    correctIndex: 0,
    tag: '기초 용어',
    difficulty: '쉬움',
    reward: 500,
    explanation: 'PBR은 주가를 주당순자산으로 나눈 값입니다. 회사가 가진 순자산 대비 시장에서 얼마에 평가되는지 볼 때 사용합니다.',
  },
  {
    id: 4,
    type: 'ox',
    question: 'ROE는 자기자본을 활용해 얼마나 이익을 냈는지 보여주는 수익성 지표이다.',
    options: ['O', 'X'],
    correctIndex: 0,
    tag: '기초 용어',
    difficulty: '보통',
    reward: 800,
    explanation: 'ROE는 당기순이익을 자기자본으로 나눠 계산합니다. 같은 자본으로 더 많은 이익을 내는 기업일수록 ROE가 높게 나타납니다.',
  },
]

const format_type = (type: QuizType) => (type === 'multiple' ? '4지선다' : 'OX')

const get_ai_intro = (quiz: MockQuizQuestion) => (
  `${quiz.id}번 문제를 같이 볼게요.\n\n` +
  `문제: ${quiz.question}\n\n` +
  `이 문제는 ${format_type(quiz.type)} 형식이고, 핵심은 "${quiz.tag}" 개념을 정확히 구분하는 것입니다. ` +
  '헷갈리는 보기를 말해주면 왜 맞고 틀린지 단계별로 설명해드릴게요.'
)

const get_ai_reply = (quiz: MockQuizQuestion, message: string) => (
  `"${message}"에 대해 설명해볼게요.\n\n` +
  `${quiz.explanation}\n\n` +
  `정답은 ${quiz.type === 'multiple' ? `${quiz.correctIndex + 1}번` : quiz.options[quiz.correctIndex]}입니다. ` +
  '필요하면 비슷한 예시 문제도 만들어서 같이 연습할 수 있어요.'
)

export default function QuizPage() {
  const { topicId = 'basic-terms', questionId = '1' } = useParams<{ topicId: string; questionId: string }>()
  const navigate = useNavigate()
  const requestedQuestionId = Number.parseInt(questionId, 10)
  const initialQuestion = MOCK_QUESTIONS.find((question) => question.id === requestedQuestionId) ?? MOCK_QUESTIONS[0]

  const [quiz, setQuiz] = useState(initialQuestion)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { id: 1, role: 'assistant', text: get_ai_intro(initialQuestion) },
  ])
  const nextAiMessageIdRef = useRef(2)

  const progressPct = Math.round((quiz.id / MOCK_QUESTIONS.length) * 100)
  const isCorrect = selected === quiz.correctIndex
  const hasPrev = quiz.id > 1
  const hasNext = quiz.id < MOCK_QUESTIONS.length

  const sync_question = (nextQuiz: MockQuizQuestion) => {
    setQuiz(nextQuiz)
    setSelected(null)
    setSubmitted(false)
    setAiOpen(false)
    setAiInput('')
    setAiMessages([{ id: nextAiMessageIdRef.current, role: 'assistant', text: get_ai_intro(nextQuiz) }])
    nextAiMessageIdRef.current += 1
  }

  const handle_next = () => {
    const nextQuiz = MOCK_QUESTIONS.find((question) => question.id === quiz.id + 1)
    if (nextQuiz) {
      sync_question(nextQuiz)
      navigate(`/learn/quiz/${topicId}/${nextQuiz.id}`)
      return
    }
    navigate(`/learn/beginner/${topicId}`)
  }

  const handle_prev = () => {
    const prevQuiz = MOCK_QUESTIONS.find((question) => question.id === quiz.id - 1)
    if (!prevQuiz) return
    sync_question(prevQuiz)
    navigate(`/learn/quiz/${topicId}/${prevQuiz.id}`)
  }

  const handle_ai_open = () => {
    setAiOpen(true)
  }

  const send_ai_message = (text: string) => {
    const value = text.trim()
    if (!value) return

    const userMessage: AiMessage = { id: nextAiMessageIdRef.current, role: 'user', text: value }
    nextAiMessageIdRef.current += 1
    const assistantMessage: AiMessage = { id: nextAiMessageIdRef.current, role: 'assistant', text: get_ai_reply(quiz, value) }
    nextAiMessageIdRef.current += 1

    setAiMessages((prev) => [...prev, userMessage, assistantMessage])
    setAiInput('')
  }

  const handle_ai_key_down = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send_ai_message(aiInput)
    }
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
            <span className="bc-link" onClick={() => navigate(`/learn/beginner/${topicId}`)}>기초 용어</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">Q{quiz.id}</span>
          </div>

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
                <span>초급 기초 용어 · Q{quiz.id} / {MOCK_QUESTIONS.length}</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} />
            </div>
            <button
              className="quiz-icon-button"
              onClick={() => setBookmarked((prev) => !prev)}
              aria-label="문제 찜하기"
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
                  {isCorrect ? `+${quiz.reward.toLocaleString()}원 획득` : 'AI 설명으로 헷갈린 개념을 바로 확인해보세요.'}
                </div>
              </div>
              <Button variant="outline" onClick={handle_ai_open}>
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
                  if (index === quiz.correctIndex) optionClass += ' correct'
                  else if (index === selected) optionClass += ' wrong'
                } else if (index === selected) {
                  optionClass += ' selected'
                }

                return (
                  <button
                    key={option}
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
                  <Button variant="outline" onClick={handle_ai_open}>
                    <i className="bi bi-stars" />
                    AI 설명
                  </Button>
                  <Button size="lg" style={{ minWidth: 200 }} onClick={() => setSubmitted(true)} disabled={selected === null}>
                    제출하기
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="ai-block" style={{ marginTop: 24 }}>
                  <span className="ai-tag">해설</span>
                  <span style={{ fontSize: 14, lineHeight: 1.6 }}>{quiz.explanation}</span>
                </div>

                <div className="quiz-bottom-actions">
                  <div className="quiz-step-nav">
                    <button onClick={handle_prev} disabled={!hasPrev}>
                      <i className="bi bi-chevron-left" />
                      이전
                    </button>
                    <button onClick={handle_next}>
                      {quiz.id === MOCK_QUESTIONS.length ? '완료' : '다음'}
                      <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                  <div className="quiz-submit-actions">
                    <Button variant="outline" onClick={handle_ai_open}>
                      <i className="bi bi-stars" />
                      AI 설명
                    </Button>
                    <Button size="lg" style={{ minWidth: 200 }} onClick={handle_next}>
                      {quiz.id === MOCK_QUESTIONS.length ? '완료하기' : '다음 문제'}
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
            <button onClick={() => send_ai_message(aiInput)} aria-label="AI에게 보내기">
              <i className="bi bi-send-fill" />
            </button>
          </footer>
        </aside>
      </div>
    </AppLayout>
  )
}
