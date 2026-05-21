import type { HTMLAttributes, CSSProperties, ReactNode } from 'react'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  active?: boolean
  children: ReactNode
}

export default function Chip({ active = false, className = '', children, ...props }: ChipProps) {
  return (
    <span className={['chip', active ? 'active' : '', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  )
}

export function ChipRow({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={['chip-row', className].filter(Boolean).join(' ')} style={style}>{children}</div>
}
