import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import MarkdownMessage from '../components/common/MarkdownMessage'
import {
  useLearnAiHistory,
  format_relative_time,
  get_session_title,
} from '../hooks/useLearnAiHistory'

export default function LearnAiHistoryPage() {
  const navigate = useNavigate()
  const { sessions, activeSessionId, setActiveSessionId, activeSession, loading, error } = useLearnAiHistory()

  return (
    <AppLayout topbarPlaceholder="학습 AI 질문 기록 검색">
      <div className="page-title">
        <div>
          <h1>학습 AI 질문 기록</h1>
          <div className="page-sub">문제 풀이 중 AI에게 물어본 내용을 문제별로 다시 확인하세요</div>
        </div>
        <Button variant="outline" onClick={() => navigate('/learn')}>
          <i className="bi bi-arrow-left" />
          학습으로
        </Button>
      </div>

      <section className="learn-ai-history-shell">
        <Card className="learn-ai-history-list-card">
          <div className="row" style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>질문 기록</div>
            <Pill variant="accent">{sessions.length}개</Pill>
          </div>

          {loading && <div className="muted">AI 질문 기록을 불러오는 중입니다.</div>}
          {!loading && error && <div className="muted">{error}</div>}
          {!loading && !error && sessions.length === 0 && (
            <div className="muted">아직 문제에서 AI에게 질문한 기록이 없습니다.</div>
          )}

          <div className="learn-ai-history-list">
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                className={`learn-ai-history-item ${session.sessionId === activeSession?.sessionId ? 'active' : ''}`}
                onClick={() => setActiveSessionId(session.sessionId)}
              >
                <span className="learn-ai-history-title">{get_session_title(session)}</span>
                <span className="learn-ai-history-preview">{session.preview}</span>
                <span className="learn-ai-history-meta">
                  Q{session.questionId ?? '-'} · {format_relative_time(session.updatedAt || session.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="learn-ai-history-detail-card">
          {activeSession ? (
            <>
              <div className="learn-ai-history-detail-header">
                <div>
                  <Pill variant="accent">Q{activeSession.questionId ?? '-'}</Pill>
                  <h2>{get_session_title(activeSession)}</h2>
                  <p>{format_relative_time(activeSession.updatedAt || activeSession.createdAt)}</p>
                </div>
                {activeSession.questionId && (
                  <Button size="sm" onClick={() => navigate(`/learn/quiz/basic-terms/${activeSession.questionId}`)}>
                    <i className="bi bi-box-arrow-up-right" />
                    문제 보기
                  </Button>
                )}
              </div>

              <div className="learn-ai-history-messages">
                {activeSession.messages.map((message) => (
                  <article
                    key={message.messageId}
                    className={`learn-ai-history-message ${message.senderType === 'USER' ? 'user' : 'assistant'}`}
                  >
                    {message.senderType === 'USER' ? (
                      <div className="ai-user-bubble">{message.messageText}</div>
                    ) : (
                      <MarkdownMessage content={message.messageText} />
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="muted">왼쪽에서 AI 질문 기록을 선택하세요.</div>
          )}
        </Card>
      </section>
    </AppLayout>
  )
}
