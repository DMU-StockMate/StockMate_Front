interface RangeBarProps {
  label: string
  low: number
  high: number
  current: number
}

export default function RangeBar({ label, low, high, current }: RangeBarProps) {
  const hasRange = high > low
  const pct = hasRange ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100)) : 50

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
      <div className="muted" style={{ fontSize: 12, flexShrink: 0 }}>{label}</div>
      <div className="muted" style={{ fontSize: 12, flexShrink: 0 }}>{hasRange ? low.toLocaleString() : '-'}</div>
      <div style={{ position: 'relative', flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, minWidth: 60 }}>
        {hasRange && (
          <div
            style={{
              position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)',
              width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)',
              border: '2px solid #fff', boxShadow: '0 0 0 1px var(--border)',
            }}
          />
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', flexShrink: 0 }}>{hasRange ? high.toLocaleString() : '-'}</div>
    </div>
  )
}
