import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Pill from '../components/common/Pill'
import Button from '../components/common/Button'
import ConceptBlockView from '../components/learn/ConceptBlockView'
import ConceptQuizCard from '../components/learn/ConceptQuizCard'
import { useConceptDetail } from '../hooks/useConceptDetail'

export default function LearnConceptDetailPage() {
  const navigate = useNavigate()
  const { concept, loading, error, prevConcept, nextConcept } = useConceptDetail()

  return (
    <AppLayout topbarPlaceholder="개념 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => navigate('/learn/concepts')}>개념정리</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{concept?.title ?? ''}</span>
      </div>

      {loading && (
        <Card><div className="muted">개념정리를 불러오는 중입니다.</div></Card>
      )}
      {!loading && error && (
        <Card><div className="muted">{error}</div></Card>
      )}

      {!loading && concept && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
          <div>
            <Card>
              <div className="row" style={{ marginBottom: 10, justifyContent: 'flex-start', gap: 8 }}>
                {concept.investmentLevel && <Pill variant="accent">{concept.investmentLevel.levelName}</Pill>}
                {concept.topic && <Pill variant="gray">{concept.topic.topicName}</Pill>}
                <span className="muted" style={{ fontSize: 12 }}>
                  <i className="bi bi-clock" /> 약 {concept.estimatedMinutes}분
                </span>
              </div>
              <h1 style={{ marginBottom: 8 }}>{concept.title}</h1>
              {concept.summary && <div className="page-sub">{concept.summary}</div>}

              {concept.learningObjectives && concept.learningObjectives.length > 0 && (
                <div style={{ background: 'var(--primary-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 20 }}>
                  <div className="strong" style={{ marginBottom: 8 }}>이 개념을 학습하면</div>
                  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {concept.learningObjectives.map((objective, i) => (
                      <li key={i} style={{ fontSize: 13.5 }}>{objective}</li>
                    ))}
                  </ul>
                  {concept.prerequisiteText && (
                    <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>선행 학습: {concept.prerequisiteText}</div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                {concept.blocks.map((block) => (
                  <div key={block.blockId} id={`block-${block.blockId}`}>
                    <ConceptBlockView block={block} />
                  </div>
                ))}
              </div>
            </Card>

            {concept.quiz && (
              <Card id="concept-quiz" style={{ marginTop: 20 }}>
                <ConceptQuizCard quiz={concept.quiz} />
              </Card>
            )}

            <div className="row" style={{ marginTop: 20 }}>
              <Button
                variant="outline"
                disabled={!prevConcept}
                onClick={() => prevConcept && navigate(`/learn/concepts/${prevConcept.slug}`)}
              >
                ← 이전 개념
              </Button>
              <Button
                disabled={!nextConcept}
                onClick={() => nextConcept && navigate(`/learn/concepts/${nextConcept.slug}`)}
              >
                다음 개념 →
              </Button>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card>
              <div className="strong" style={{ marginBottom: 8 }}>목차</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {concept.blocks.filter((block) => block.title).map((block) => (
                  <a key={block.blockId} href={`#block-${block.blockId}`} className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>
                    {block.title}
                  </a>
                ))}
                {concept.quiz && (
                  <a href="#concept-quiz" className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>개념 확인 퀴즈</a>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
