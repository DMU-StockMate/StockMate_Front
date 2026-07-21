import Pill from '../common/Pill'
import Button from '../common/Button'
import type { CommunityPost } from '../../api/community'
import { format_community_date } from '../../utils/community'

interface PostDetailCardProps {
  post: CommunityPost
  canManage: boolean
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}

export default function PostDetailCard({ post, canManage, deleting, onEdit, onDelete }: PostDetailCardProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Pill variant={post.boardType === 'STOCK' ? 'accent' : 'gray'}>
          {post.boardType === 'STOCK' ? (post.stockName ?? post.ticker ?? '종목') : '자유'}
        </Pill>
        <span className="muted" style={{ fontSize: 12 }}>{format_community_date(post.createdAt)}</span>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 12 }}>{post.title}</h1>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="muted" style={{ fontSize: 13 }}>{post.authorNickname}</div>
        {canManage && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" variant="outline" onClick={onEdit}>수정</Button>
            <Button size="sm" variant="ghost" disabled={deleting} onClick={onDelete}>삭제</Button>
          </div>
        )}
      </div>

      <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--t1)' }}>
        {post.content}
      </div>
    </div>
  )
}
