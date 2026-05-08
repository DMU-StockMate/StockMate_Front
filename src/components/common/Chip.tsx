import { HTMLAttributes, ReactNode } from 'react'

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

export function ChipRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={['chip-row', className].filter(Boolean).join(' ')}>{children}</div>
}
