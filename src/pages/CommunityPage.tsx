import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pagination from '../components/common/Pagination'
import BoardTabs from '../components/community/BoardTabs'
import PostSearchBar from '../components/community/PostSearchBar'
import PostListTable from '../components/community/PostListTable'
import { useCommunityPosts } from '../hooks/useCommunityPosts'
import { useAuth } from '../hooks/useAuth'

export default function CommunityPage() {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const community = useCommunityPosts('STOCK')

  const handle_write = () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    navigate('/community/write', { state: { boardType: community.boardType } })
  }

  return (
    <AppLayout topbarPlaceholder="커뮤니티 검색">
      <div className="page-title">
        <div>
          <h1>커뮤니티</h1>
          <div className="page-sub">종목 이야기와 자유로운 이야기를 나눠보세요</div>
        </div>
        <Button onClick={handle_write}>
          <i className="bi bi-pencil-square" />
          글쓰기
        </Button>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <BoardTabs value={community.boardType} onChange={community.handle_change_board} />
        <div style={{ width: 320 }}>
          <PostSearchBar
            keyword={community.keyword}
            onKeywordChange={community.setKeyword}
            onSearch={community.handle_search}
          />
        </div>
      </div>

      {community.error && (
        <div style={{ color: 'var(--up)', fontSize: 13, marginBottom: 12 }}>{community.error}</div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <PostListTable
          posts={community.posts}
          loading={community.loading}
          currentUserId={user?.id}
          actionPostId={community.actionPostId}
          onDelete={(postId) => void community.remove(postId)}
        />
      </Card>

      <Pagination page={community.page} totalPages={community.totalPages} onChange={community.setPage} />
    </AppLayout>
  )
}
