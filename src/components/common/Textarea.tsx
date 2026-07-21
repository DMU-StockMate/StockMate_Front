import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

export default function Textarea({
  label,
  error,
  helper,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={['textarea', error ? 'textarea-error' : '', className].filter(Boolean).join(' ')}
        {...props}
      />
      {error && <span className="input-error-msg">{error}</span>}
      {!error && helper && <span className="input-helper">{helper}</span>}
    </div>
  )
}
