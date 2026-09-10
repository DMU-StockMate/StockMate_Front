import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pill from '../common/Pill'
import Button from '../common/Button'
import ConfirmModal from '../common/ConfirmModal'
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
  const [confirmPostId, setConfirmPostId] = useState<number | null>(null)

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>게시글을 불러오는 중...</div>
  }

  if (posts.length === 0) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>등록된 게시글이 없습니다.</div>
  }

  return (
    <>
      <table className="tbl community-post-table" style={{ width: '100%' }}>
        <thead>
          <tr style={{ background: 'var(--primary-subtle)' }}>
            <th style={{ paddingLeft: 24 }}>제목</th>
            <th>작성자</th>
            <th>좋아요</th>
            <th>댓글</th>
            <th>작성일</th>
            <th style={{ paddingRight: 24 }} />
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.postId} onClick={() => navigate(`/community/${post.postId}`)} style={{ cursor: 'pointer' }}>
              <td style={{ paddingLeft: 24 }}>
                <div className="community-post-title-row">
                  {post.boardType === 'STOCK' && post.stock && (
                    <Pill variant="accent">{post.stock.companyName}</Pill>
                  )}
                  <span className="strong community-text">{post.title}</span>
                </div>
              </td>
              <td className="muted" style={{ fontSize: 13 }}>{post.author?.nickname ?? '탈퇴한 사용자'}</td>
              <td className="muted" style={{ fontSize: 13 }}>{post.likeCount}</td>
              <td className="muted" style={{ fontSize: 13 }}>{post.commentCount}</td>
              <td className="muted" style={{ fontSize: 13 }}>{format_community_date(post.createdAt)}</td>
              <td style={{ paddingRight: 24 }} onClick={(event) => event.stopPropagation()}>
                {currentUserId !== undefined && post.userId === currentUserId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actionPostId === post.postId}
                    onClick={() => setConfirmPostId(post.postId)}
                  >
                    삭제
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal
        open={confirmPostId !== null}
        title="정말 삭제하시겠습니까?"
        message="삭제한 게시글은 복구할 수 없습니다."
        onConfirm={() => {
          if (confirmPostId !== null) onDelete(confirmPostId)
          setConfirmPostId(null)
        }}
        onCancel={() => setConfirmPostId(null)}
      />
    </>
  )
}
