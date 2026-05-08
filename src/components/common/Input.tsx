import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export default function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={leftIcon || rightIcon ? 'input-with-icon' : ''} style={{ position: 'relative' }}>
        {leftIcon && <span className="input-icon">{leftIcon}</span>}
        <input
          id={inputId}
          className={['input', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
          style={rightIcon ? { paddingRight: 42 } : undefined}
          {...props}
        />
        {rightIcon && (
          <span
            className="input-icon"
            style={{ left: 'auto', right: 14 }}
          >
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
      {!error && helper && <span className="input-helper">{helper}</span>}
    </div>
  )
}
