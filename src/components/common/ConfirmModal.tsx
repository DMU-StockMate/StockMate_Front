import Button from './Button'

interface ConfirmModalProps {
  open: boolean
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = '삭제',
  cancelText = '취소',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ width: 380 }} onClick={(event) => event.stopPropagation()}>
        <h2 style={{ fontSize: 18, marginBottom: message ? 10 : 22 }}>{title}</h2>
        {message && <div className="muted" style={{ fontSize: 14, marginBottom: 22 }}>{message}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button variant={danger ? 'up' : 'primary'} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}
