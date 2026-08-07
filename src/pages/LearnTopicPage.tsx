import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import Pill from '../components/common/Pill'
import Chip, { ChipRow } from '../components/common/Chip'
import Pagination from '../components/common/Pagination'
import { useLearnTopic, type FilterType, type QuizItem } from '../hooks/useLearnTopic'

export default function LearnTopicPage() {
  const navigate = useNavigate()
  const {
    topic, section, meta, sectionLabel, filter, setFilter,
    filtered, paginated, page, totalPages, setPage,
    questionLoadError, loading,
    totalDone, wrongCount, correctCount, earned, progressPct, nextQuiz, quizzes,
    handle_quiz_click,
  } = useLearnTopic()

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => navigate(`/learn/${section}`)}>{sectionLabel}</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{meta.title}</span>
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="topic-ico" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 28 }}>
            <i className={`bi ${meta.icon}`} />
          </div>
          <div>
            <h1>{meta.title}</h1>
            <div className="page-sub">{sectionLabel} · {quizzes.length}문제</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" disabled={!nextQuiz} onClick={() => nextQuiz && navigate(`/learn/quiz/${topic}/${nextQuiz.id}`)}>
            한 번에 풀기
          </Button>
          <Button disabled={!nextQuiz} onClick={() => nextQuiz && navigate(`/learn/quiz/${topic}/${nextQuiz.id}`)}>
            이어서 풀기 →
          </Button>
        </div>
      </div>

      {questionLoadError && (
        <div className="ai-block" style={{ marginBottom: 20 }}>
          <span className="ai-tag">알림</span>
          <span style={{ fontSize: 14 }}>{questionLoadError}</span>
        </div>
      )}

      <Card style={{ marginBottom: 20, background: 'var(--gradient-soft)', borderColor: '#D8CDF0' }}>
        <div className="row">
          <div>
            <div className="strong" style={{ fontSize: 15 }}>
              {totalDone} / {quizzes.length} 문제 풀이 완료
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              정답 {correctCount} · 오답 {wrongCount} · 정답률 {totalDone > 0 ? Math.round((correctCount / totalDone) * 100) : 0}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 12 }}>획득 자금</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
              +{earned.toLocaleString()}원
            </div>
          </div>
        </div>
        <Progress value={progressPct} style={{ marginTop: 14 }} />
      </Card>

      <div className="row" style={{ marginBottom: 16 }}>
        <ChipRow>
          {(['전체', '미완료', '완료', '오답', '찜'] as FilterType[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </ChipRow>
        <span className="muted" style={{ fontSize: 12 }}>전체 {filtered.length}문제 중 {paginated.length}개 표시</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {loading && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="muted">문제 목록을 불러오는 중입니다.</div>
          </Card>
        )}
        {!loading && filtered.length === 0 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="muted">표시할 문제가 없습니다.</div>
          </Card>
        )}
        {!loading && paginated.map((quiz: QuizItem) => (
          <div
            key={quiz.id}
            className={`quiz-mini ${quiz.status === 'done' ? 'done' : ''} ${quiz.status === 'current' ? 'current' : ''} ${quiz.isWrong ? 'wrong' : ''}`}
            onClick={() => handle_quiz_click(quiz)}
          >
            <div className="qm-num" style={quiz.status === 'current' ? { color: 'var(--accent)' } : {}}>
              Q{Math.max(1, quizzes.findIndex((item) => item.id === quiz.id) + 1)}{quiz.status === 'current' ? ' · 다음 문제' : ''}
            </div>
            <div className="qm-q">{quiz.question}</div>
            <div className="qm-foot">
              <span>{quiz.difficulty}</span>
              <Pill variant={quiz.status !== 'done' ? 'primary' : quiz.isWrong ? 'up' : 'success'}>
                {quiz.status === 'done' && quiz.isWrong
                  ? `미획득 · ${quiz.reward.toLocaleString()}원`
                  : `+${quiz.reward.toLocaleString()}원`}
              </Pill>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </AppLayout>
  )
}
