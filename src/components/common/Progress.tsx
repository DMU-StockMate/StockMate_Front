interface ProgressProps {
  value: number
  max?: number
  variant?: 'default' | 'hero' | 'success' | 'warning'
  thin?: boolean
  className?: string
}

export default function Progress({
  value,
  max = 100,
  variant = 'default',
  thin = false,
  className = '',
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const wrapperClass = [
    'progress',
    variant === 'hero' ? 'progress-hero' : '',
    variant === 'success' ? 'progress-success' : '',
    variant === 'warning' ? 'progress-warning' : '',
    thin ? 'progress-thin' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClass} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <i className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
