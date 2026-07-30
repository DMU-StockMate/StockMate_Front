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
    meta, filter, setFilter,
    backendQuestions, filteredTopics,
    stats, questionLoadError, loading,
    solvedCount, progressPct, earned,
    handle_topic_click,
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

      {questionLoadError && (
        <div className="ai-block" style={{ marginBottom: 20 }}>
          <span className="ai-tag">알림</span>
          <span style={{ fontSize: 14 }}>{questionLoadError}</span>
        </div>
      )}

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>카테고리 {filteredTopics.length}개</div>
        <ChipRow>
          {(['전체', '진행 중', '미시작'] as FilterType[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f as '전체' | '진행 중' | '미시작')}>{f}</Chip>
          ))}
        </ChipRow>
      </div>

      {loading && (
        <Card><div className="muted">카테고리를 불러오는 중입니다.</div></Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {!loading && filteredTopics.map((topic) => (
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
            <Progress value={topic.count > 0 ? Math.round((topic.solvedCount / topic.count) * 100) : 0} max={100} thin />
            <div className="topic-stats">
              <span>{topic.count}문제 · 완료 {topic.solvedCount}개</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
