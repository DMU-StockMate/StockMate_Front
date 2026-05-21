import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hero' | 'lg'
  clickable?: boolean
  children: ReactNode
}

export default function Card({
  variant = 'default',
  clickable = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = [
    'card',
    variant === 'hero' ? 'card-hero' : '',
    variant === 'lg' ? 'card-lg' : '',
    clickable ? 'card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
