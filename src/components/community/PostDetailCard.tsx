import Pill from '../common/Pill'
import Button from '../common/Button'
import type { CommunityPost } from '../../api/community'
import { format_community_date } from '../../utils/community'

interface PostDetailCardProps {
  post: CommunityPost
  canManage: boolean
  deleting: boolean
  liked: boolean
  likePending: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleLike: () => void
}

export default function PostDetailCard({
  post,
  canManage,
  deleting,
  liked,
  likePending,
  onEdit,
  onDelete,
  onToggleLike,
}: PostDetailCardProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Pill variant={post.boardType === 'STOCK' ? 'accent' : 'gray'}>
          {post.boardType === 'STOCK' ? (post.stock?.companyName ?? '종목') : '자유'}
        </Pill>
        <span className="muted" style={{ fontSize: 12 }}>{format_community_date(post.createdAt)}</span>
        <span className="muted" style={{ fontSize: 12 }}>· 조회 {post.viewCount.toLocaleString()}</span>
      </div>

      <h1 className="community-text" style={{ fontSize: 22, marginBottom: 12 }}>{post.title}</h1>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="muted" style={{ fontSize: 13 }}>{post.author?.nickname ?? '탈퇴한 사용자'}</div>
        {canManage && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" variant="outline" onClick={onEdit}>수정</Button>
            <Button size="sm" variant="ghost" style={{ color: 'var(--up)' }} disabled={deleting} onClick={onDelete}>삭제</Button>
          </div>
        )}
      </div>

      <div className="community-text" style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--t1)', marginBottom: 20 }}>
        {post.content}
      </div>

      <Button variant={liked ? 'primary' : 'outline'} size="sm" disabled={likePending} onClick={onToggleLike}>
        <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`} />
        좋아요 {post.likeCount.toLocaleString()}
      </Button>
    </div>
  )
}
