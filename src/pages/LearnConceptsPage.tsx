import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Pill from '../components/common/Pill'
import Chip, { ChipRow } from '../components/common/Chip'
import Pagination from '../components/common/Pagination'
import LearningHelp, { HELP_DESCRIPTIONS, HELP_STEPS } from '../components/learn/LearningHelp'
import { useConcepts } from '../hooks/useConcepts'

export default function LearnConceptsPage() {
  const navigate = useNavigate()
  const {
    filtered, paginated, loading, levelFilter, setLevelFilter, levelTabs,
    page, totalPages, setPage, handle_open_concept,
  } = useConcepts()

  return (
    <AppLayout topbarPlaceholder="개념 검색">
      <div className="page-title">
        <div>
          <h1 className="title-with-help">
            개념정리
            <LearningHelp
              title="개념정리"
              description={HELP_DESCRIPTIONS.CONCEPT_SUMMARY}
              tutorialType="CONCEPT_SUMMARY"
              steps={HELP_STEPS.CONCEPT_SUMMARY}
              onStartFullTutorial={() => navigate('/learn', { state: { startTutorial: true } })}
            />
          </h1>
          <div className="page-sub">투자 핵심 개념을 블로그처럼 읽고 이해해요</div>
        </div>
      </div>

      <div data-tour="concept-level-filter" style={{ marginBottom: 20 }}>
        <ChipRow>
          {levelTabs.map((level) => (
            <Chip key={level} active={levelFilter === level} onClick={() => setLevelFilter(level)}>{level}</Chip>
          ))}
        </ChipRow>
      </div>

      <div data-tour="concept-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {loading && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="muted">개념정리 목록을 불러오는 중입니다.</div>
          </Card>
        )}
        {!loading && filtered.length === 0 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="muted">표시할 개념정리가 없습니다.</div>
          </Card>
        )}
        {!loading && paginated.map((concept) => (
          <Card
            key={concept.conceptId}
            clickable
            onClick={() => handle_open_concept(concept.slug)}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div className="row">
              {concept.investmentLevel && <Pill variant="accent">{concept.investmentLevel.levelName}</Pill>}
              {concept.topic && <Pill variant="gray">{concept.topic.topicName}</Pill>}
            </div>
            <div className="strong" style={{ fontSize: 16 }}>{concept.title}</div>
            {concept.summary && (
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{concept.summary}</div>
            )}
            <div className="muted" style={{ fontSize: 12, marginTop: 'auto' }}>
              <i className="bi bi-clock" /> 약 {concept.estimatedMinutes}분
            </div>
          </Card>
        ))}
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </AppLayout>
  )
}
