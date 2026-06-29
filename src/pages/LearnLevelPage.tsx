import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Progress from '../components/common/Progress'
import Pill from '../components/common/Pill'
import Chip, { ChipRow } from '../components/common/Chip'
import { useLearnLevel } from '../hooks/useLearnLevel'

type FilterType = '전체' | '진행 중' | '미시작'

const statusLabel: Record<'active' | 'not-started', string> = {
  active: '진행 가능',
  'not-started': '미시작',
}

const pillVariantForStatus: Record<'active' | 'not-started', 'primary' | 'gray'> = {
  active: 'primary',
  'not-started': 'gray',
}

export default function LearnLevelPage() {
  const navigate = useNavigate()
  const {
    section, meta, filter, setFilter,
    backendQuestions, filteredTopics,
    stats, questionLoadError, loading,
    solvedCount, progressPct, earned,
    handle_topic_click, handle_question_click,
  } = useLearnLevel()

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{meta.title}</span>
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className="lv-badge"
            style={{ width: 56, height: 56, borderRadius: 16, fontSize: 24, background: meta.badgeBg }}
          >
            {meta.badge}
          </div>
          <div>
            <h1>{meta.title}</h1>
            <div className="page-sub">{meta.sub}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: 12 }}>전체 진행률</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{progressPct}%</div>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { label: '총 문제', value: backendQuestions.length, color: '' },
            { label: '완료', value: solvedCount, color: 'var(--success)' },
            { label: '정답률', value: `${stats?.accuracy ?? 0}%`, color: '' },
            { label: '획득 자금', value: `+${earned.toLocaleString()}원`, color: 'var(--primary)' },
          ].map((s) => (
            <div key={s.label}>
              <div className="label">{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color || 'var(--t1)', marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <Progress value={progressPct} style={{ marginTop: 18 }} />
      </Card>

      <div style={{ marginBottom: 28 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>등록 문제 {backendQuestions.length}개</div>
          {questionLoadError && <span className="muted" style={{ fontSize: 12 }}>{questionLoadError}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {loading && (
            <Card style={{ gridColumn: '1 / -1' }}>
              <div className="muted">문제 목록을 불러오는 중입니다.</div>
            </Card>
          )}
          {!loading && backendQuestions.map((question) => (
            <div
              key={question.id}
              className={`quiz-mini ${question.solved ? 'done' : 'available'}`}
              onClick={() => handle_question_click(question.id)}
            >
              <div className="qm-num">Q{question.id} · {question.type === 'OX' ? 'OX' : '객관식'}</div>
              <div className="qm-q">{question.question}</div>
              <div className="qm-foot">
                <span>{question.solved ? '풀이 완료' : '미완료'}</span>
                <Pill variant={question.solved ? 'success' : 'primary'}>+{question.reward.toLocaleString()}원</Pill>
              </div>
            </div>
          ))}
          {!loading && backendQuestions.length === 0 && (
            <Card style={{ gridColumn: '1 / -1' }}>
              <div className="muted">아직 표시할 문제가 없습니다.</div>
            </Card>
          )}
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>대주제 {meta.topics.length}개</div>
        <ChipRow>
          {(['전체', '진행 중', '미시작'] as FilterType[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f as '전체' | '진행 중' | '미시작')}>{f}</Chip>
          ))}
        </ChipRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            className="topic-card"
            onClick={() => handle_topic_click(topic)}
          >
            <div className="row">
              <div className="topic-ico"><i className={`bi ${topic.icon}`} /></div>
              <Pill variant={pillVariantForStatus[topic.status]}>
                {statusLabel[topic.status]}
              </Pill>
            </div>
            <div>
              <div className="topic-title">{topic.title}</div>
              <div className="topic-desc">{topic.desc}</div>
            </div>
            <Progress value={0} max={1} thin />
            <div className="topic-stats">
              <span>문제 API 기준으로 목록을 표시합니다.</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
