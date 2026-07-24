import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import ConfirmModal from '../components/common/ConfirmModal'
import PostDetailCard from '../components/community/PostDetailCard'
import CommentList from '../components/community/CommentList'
import { useCommunityPost } from '../hooks/useCommunityPost'
import { useAuth } from '../hooks/useAuth'

export default function CommunityPostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const community = useCommunityPost(postId)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const handle_confirm_delete = async () => {
    setConfirmDeleteOpen(false)
    await community.remove_post()
  }

  return (
    <AppLayout topbarPlaceholder="커뮤니티 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/community')}>커뮤니티</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">게시글</span>
      </div>

      {community.loading ? (
        <Card style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>게시글을 불러오는 중...</Card>
      ) : community.error || !community.post ? (
        <Card style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>
          {community.error || '게시글을 찾을 수 없습니다.'}
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <PostDetailCard
              post={community.post}
              canManage={user?.id !== undefined && community.post.userId === user.id}
              deleting={community.deletingPost}
              liked={community.liked}
              likePending={community.likePending}
              onEdit={() => navigate(`/community/${postId}/edit`)}
              onDelete={() => setConfirmDeleteOpen(true)}
              onToggleLike={() => void community.toggle_like()}
            />
          </Card>

          <Card>
            <CommentList
              comments={community.comments}
              loading={community.commentsLoading}
              error={community.commentError}
              currentUserId={user?.id}
              actionCommentId={community.actionCommentId}
              submitting={community.submittingComment}
              isLoggedIn={isLoggedIn}
              onAdd={community.add_comment}
              onEdit={community.edit_comment}
              onDelete={(commentId) => void community.remove_comment(commentId)}
            />
          </Card>
        </>
      )}

      <ConfirmModal
        open={confirmDeleteOpen}
        title="정말 삭제하시겠습니까?"
        message="삭제한 게시글은 복구할 수 없습니다."
        onConfirm={() => void handle_confirm_delete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </AppLayout>
  )
}
