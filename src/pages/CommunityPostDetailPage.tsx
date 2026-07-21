import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import PostDetailCard from '../components/community/PostDetailCard'
import CommentList from '../components/community/CommentList'
import { useCommunityPost } from '../hooks/useCommunityPost'
import { useAuth } from '../hooks/useAuth'

export default function CommunityPostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const community = useCommunityPost(postId)

  const handle_delete_post = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return
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
              canManage={user?.id !== undefined && community.post.authorId === user.id}
              deleting={community.deletingPost}
              onEdit={() => navigate(`/community/${postId}/edit`)}
              onDelete={() => void handle_delete_post()}
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
    </AppLayout>
  )
}
