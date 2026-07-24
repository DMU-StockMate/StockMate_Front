import { useNavigate, useParams, useLocation } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import PostForm from '../components/community/PostForm'
import { useCommunityPostForm } from '../hooks/useCommunityPostForm'
import type { CommunityBoardType } from '../api/community'

interface WriteLocationState {
  boardType?: CommunityBoardType
  stock?: { ticker: string; companyName: string } | null
}

export default function CommunityPostWritePage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as WriteLocationState) ?? {}
  const form = useCommunityPostForm(postId, state.boardType ?? 'FREE', state.stock ?? null)

  const handle_cancel = () => {
    navigate(postId ? `/community/${postId}` : '/community')
  }

  return (
    <AppLayout topbarPlaceholder="커뮤니티 검색">
      <div className="page-title">
        <div>
          <h1>{form.isEdit ? '게시글 수정' : '게시글 작성'}</h1>
        </div>
      </div>

      <Card>
        {form.loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>불러오는 중...</div>
        ) : (
          <PostForm
            boardType={form.boardType}
            onBoardTypeChange={form.setBoardType}
            boardTypeLocked={form.isEdit}
            selectedStock={form.selectedStock}
            onSelectStock={form.setSelectedStock}
            title={form.title}
            onTitleChange={form.setTitle}
            content={form.content}
            onContentChange={form.setContent}
            errors={form.errors}
            submitting={form.submitting}
            onSubmit={() => void form.handle_submit()}
            onCancel={handle_cancel}
          />
        )}
      </Card>
    </AppLayout>
  )
}
