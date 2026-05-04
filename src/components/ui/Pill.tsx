import { HTMLAttributes, ReactNode } from 'react'

type PillVariant = 'primary' | 'gray' | 'up' | 'down' | 'success' | 'warning' | 'accent' | 'outline-light'
type PillSize = 'sm' | 'lg'

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant
  size?: PillSize
  children: ReactNode
}

const variantClass: Record<PillVariant, string> = {
  primary: '',
  gray: 'pill-gray',
  up: 'pill-up',
  down: 'pill-down',
  success: 'pill-success',
  warning: 'pill-warning',
  accent: 'pill-accent',
  'outline-light': 'pill-outline-light',
}

export default function Pill({
  variant = 'primary',
  size,
  className = '',
  children,
  ...props
}: PillProps) {
  const classes = [
    'pill',
    variantClass[variant],
    size === 'lg' ? 'pill-lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}
