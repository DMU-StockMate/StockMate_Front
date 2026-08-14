import Card from '../common/Card'
import type { ConceptBlock } from '../../api/learning'

const CALLOUT_STYLES: Record<string, { icon: string; border: string }> = {
  WARNING: { icon: 'bi-exclamation-triangle-fill', border: '#F59E0B' },
  TIP: { icon: 'bi-lightbulb-fill', border: '#10B981' },
  KEY_POINT: { icon: 'bi-key-fill', border: 'var(--primary)' },
  EXAMPLE: { icon: 'bi-journal-bookmark-fill', border: '#3B82F6' },
  QUOTE: { icon: 'bi-quote', border: 'var(--t3)' },
  CASE_STUDY: { icon: 'bi-briefcase-fill', border: '#3B82F6' },
}

export default function ConceptBlockView({ block }: { block: ConceptBlock }) {
  const json = block.contentJson

  if (block.blockType === 'HEADING') {
    return <div className="section-title" style={{ marginTop: 24 }}>{block.title}</div>
  }

  if (block.blockType === 'TABLE' && Array.isArray(json?.headers) && Array.isArray(json?.rows)) {
    const headers = json.headers as string[]
    const rows = json.rows as string[][]
    return (
      <div style={{ margin: '16px 0' }}>
        {block.title && <div className="strong" style={{ marginBottom: 8 }}>{block.title}</div>}
        <table className="tbl">
          <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.blockType === 'FORMULA' && typeof json?.formula === 'string') {
    return (
      <div className="ai-block" style={{ borderLeft: '3px solid var(--primary)', margin: '16px 0' }}>
        {block.title && <div className="strong" style={{ marginBottom: 6 }}>{block.title}</div>}
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{json.formula}</div>
        {typeof json.description === 'string' && (
          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>{json.description}</div>
        )}
      </div>
    )
  }

  if (block.blockType === 'INFOGRAPHIC' && Array.isArray(json?.steps)) {
    const steps = json.steps as string[]
    return (
      <div style={{ margin: '16px 0' }}>
        {block.title && <div className="strong" style={{ marginBottom: 8 }}>{block.title}</div>}
        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {steps.map((step, i) => <li key={i} style={{ fontSize: 14 }}>{step}</li>)}
        </ol>
      </div>
    )
  }

  if (block.blockType === 'SUMMARY' && Array.isArray(json?.items)) {
    const items = json.items as string[]
    return (
      <Card variant="hero" style={{ margin: '20px 0' }}>
        <div className="strong" style={{ fontSize: 16, marginBottom: 10 }}>
          <i className="bi bi-check2-circle" /> {block.title ?? '핵심 정리'}
        </div>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => <li key={i} style={{ fontSize: 14 }}>{item}</li>)}
        </ul>
      </Card>
    )
  }

  if (block.blockType === 'EXAMPLE' && Array.isArray(json?.cases)) {
    const cases = json.cases as Record<string, string>[]
    const conclusion = typeof json.conclusion === 'string' ? json.conclusion : null
    return (
      <div style={{ margin: '16px 0' }}>
        {block.title && <div className="strong" style={{ marginBottom: 8 }}>{block.title}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cases.length}, 1fr)`, gap: 12 }}>
          {cases.map((item, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className={key === Object.keys(item)[0] ? 'strong' : 'muted'} style={{ fontSize: 13, marginTop: 2 }}>
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
        {conclusion && <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>{conclusion}</div>}
      </div>
    )
  }

  const callout = CALLOUT_STYLES[block.blockType]
  if (callout) {
    return (
      <div className="ai-block" style={{ borderLeft: `3px solid ${callout.border}`, margin: '16px 0' }}>
        {block.title && (
          <div className="strong" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`bi ${callout.icon}`} />
            {block.title}
          </div>
        )}
        {block.contentText && (
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{block.contentText}</div>
        )}
      </div>
    )
  }

  if (block.blockType === 'INTRO') {
    return (
      <div style={{ margin: '16px 0' }}>
        {block.title && <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>{block.title}</div>}
        {block.contentText && (
          <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--t2)' }}>{block.contentText}</div>
        )}
      </div>
    )
  }

  return (
    <div style={{ margin: '14px 0' }}>
      {block.title && <div className="strong" style={{ marginBottom: 6 }}>{block.title}</div>}
      {block.contentText && (
        <div style={{ fontSize: 14.5, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{block.contentText}</div>
      )}
    </div>
  )
}
