import CommentItem from './CommentItem'
import CommentForm from './CommentForm'
import type { CommunityComment } from '../../api/community'

interface CommentListProps {
  comments: CommunityComment[]
  loading: boolean
  error: string
  currentUserId?: number
  actionCommentId: number | null
  submitting: boolean
  isLoggedIn: boolean
  onAdd: (content: string) => Promise<void>
  onEdit: (commentId: number, content: string) => Promise<void>
  onDelete: (commentId: number) => void
}

export default function CommentList({
  comments,
  loading,
  error,
  currentUserId,
  actionCommentId,
  submitting,
  isLoggedIn,
  onAdd,
  onEdit,
  onDelete,
}: CommentListProps) {
  return (
    <div>
      <div className="section-title" style={{ marginBottom: 8 }}>댓글 {comments.length}</div>

      {error && <div style={{ color: 'var(--up)', fontSize: 13, marginBottom: 8 }}>{error}</div>}

      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--t2)' }}>댓글을 불러오는 중...</div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--t3)' }}>첫 댓글을 남겨보세요.</div>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.commentId}
            comment={comment}
            canManage={currentUserId !== undefined && comment.userId === currentUserId}
            isProcessing={actionCommentId === comment.commentId}
            onSave={onEdit}
            onDelete={onDelete}
          />
        ))
      )}

      <CommentForm isLoggedIn={isLoggedIn} submitting={submitting} onSubmit={onAdd} />
    </div>
  )
}
