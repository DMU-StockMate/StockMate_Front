import { useState } from 'react'
import Button from '../common/Button'
import Textarea from '../common/Textarea'
import type { CommunityComment } from '../../api/community'
import { format_community_date } from '../../utils/community'

interface CommentItemProps {
  comment: CommunityComment
  canManage: boolean
  isProcessing: boolean
  onSave: (commentId: number, content: string) => Promise<void>
  onDelete: (commentId: number) => void
}

export default function CommentItem({ comment, canManage, isProcessing, onSave, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)

  const handle_start_edit = () => {
    setDraft(comment.content)
    setIsEditing(true)
  }

  const handle_save = async () => {
    if (!draft.trim()) return
    await onSave(comment.commentId, draft.trim())
    setIsEditing(false)
  }

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="strong" style={{ fontSize: 13 }}>{comment.authorNickname}</span>
          <span className="muted" style={{ fontSize: 12 }}>{format_community_date(comment.createdAt)}</span>
        </div>
        {canManage && !isEditing && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Button size="sm" variant="ghost" disabled={isProcessing} onClick={handle_start_edit}>수정</Button>
            <Button size="sm" variant="ghost" disabled={isProcessing} onClick={() => onDelete(comment.commentId)}>삭제</Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            style={{ minHeight: 80 }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Button size="sm" disabled={isProcessing} onClick={() => void handle_save()}>저장</Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>취소</Button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{comment.content}</div>
      )}
    </div>
  )
}
