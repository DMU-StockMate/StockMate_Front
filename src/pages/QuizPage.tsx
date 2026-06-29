import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import Chip, { ChipRow } from '../components/common/Chip'
import MarkdownMessage from '../components/common/MarkdownMessage'
import { useQuiz } from '../hooks/useQuiz'
import type { QuizType } from '../hooks/useQuiz'
import { useNavigate } from 'react-router-dom'

const format_type = (type: QuizType) => (type === 'multiple' ? '4지선다' : 'OX')

export default function QuizPage() {
  const navigate = useNavigate()
  const {
    quiz, questions, selected, setSelected,
    submitted, submitResult,
    bookmarked, bookmarkSaving,
    aiOpen, setAiOpen,
    aiInput, setAiInput,
    aiMessages, aiSending,
    loading, error,
    submitting,
    topicId,
    currentIndex, progressPct, hasPrev, hasNext,
    handle_next, handle_prev,
    handle_bookmark_toggle, handle_submit,
    send_ai_message, handle_ai_key_down,
  } = useQuiz()

  const resultCorrectIndex = quiz?.correctIndex ?? -1
  const isCorrect = submitResult?.correct ?? false

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
                  <Button size="lg" style={{ minWidth: 200 }} onClick={() => void handle_submit()} disabled={selected === null || submitting}>
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
                {message.role === 'assistant' ? (
                  <MarkdownMessage content={message.text} />
                ) : (
                  message.text.split('\n').map((line, index) => (
                    <span key={`${message.id}-${index}`}>{line || ' '}</span>
                  ))
                )}
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
