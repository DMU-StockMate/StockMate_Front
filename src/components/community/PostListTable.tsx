import { useNavigate } from 'react-router-dom'
import Pill from '../common/Pill'
import Button from '../common/Button'
import type { CommunityPost } from '../../api/community'
import { format_community_date } from '../../utils/community'

interface PostListTableProps {
  posts: CommunityPost[]
  loading: boolean
  currentUserId?: number
  actionPostId: number | null
  onDelete: (postId: number) => void
}

export default function PostListTable({ posts, loading, currentUserId, actionPostId, onDelete }: PostListTableProps) {
  const navigate = useNavigate()

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>게시글을 불러오는 중...</div>
  }

  if (posts.length === 0) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>등록된 게시글이 없습니다.</div>
  }

  return (
    <table className="tbl" style={{ width: '100%' }}>
      <thead>
        <tr style={{ background: 'var(--primary-subtle)' }}>
          <th style={{ paddingLeft: 24 }}>제목</th>
          <th>작성자</th>
          <th>댓글</th>
          <th>작성일</th>
          <th style={{ paddingRight: 24 }} />
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.postId} onClick={() => navigate(`/community/${post.postId}`)} style={{ cursor: 'pointer' }}>
            <td style={{ paddingLeft: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {post.boardType === 'STOCK' && post.ticker && (
                  <Pill variant="accent">{post.stockName ?? post.ticker}</Pill>
                )}
                <span className="strong">{post.title}</span>
              </div>
            </td>
            <td className="muted" style={{ fontSize: 13 }}>{post.authorNickname}</td>
            <td className="muted" style={{ fontSize: 13 }}>{post.commentCount ?? 0}</td>
            <td className="muted" style={{ fontSize: 13 }}>{format_community_date(post.createdAt)}</td>
            <td style={{ paddingRight: 24 }} onClick={(event) => event.stopPropagation()}>
              {currentUserId !== undefined && post.authorId === currentUserId && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={actionPostId === post.postId}
                  onClick={() => onDelete(post.postId)}
                >
                  삭제
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
