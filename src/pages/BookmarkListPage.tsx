import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Chip, { ChipRow } from '../components/common/Chip'
import Pill from '../components/common/Pill'
import { useNavigate } from 'react-router-dom'
import {
  useBookmarks,
  get_bookmark_question_id,
  get_bookmark_question_text,
  get_bookmark_question_type,
  get_bookmark_level_id,
  get_bookmark_difficulty,
  get_bookmark_reward,
  type BookmarkSortType,
} from '../hooks/useBookmarks'
import type { QuizBookmark } from '../api/learning'

const get_bookmark_id = (bookmark: QuizBookmark) =>
  Number((bookmark as Record<string, unknown>).bookmark_id ?? (bookmark as Record<string, unknown>).bookmarkId ?? 0)

export default function BookmarkListPage() {
  const navigate = useNavigate()
  const { bookmarks, sorted, loading, error, removingId, sort, setSort, handle_remove, handle_quiz_click } = useBookmarks()

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">찜한 문제</span>
      </div>

      <div className="page-title">
        <div>
          <h1>찜한 문제</h1>
          <div className="page-sub">찜한 문제를 모아서 복습해보세요 · 총 {bookmarks.length}문제</div>
        </div>
        <Button variant="outline" onClick={() => navigate('/learn')}>
          <i className="bi bi-arrow-left" />
          학습으로
        </Button>
      </div>

      {error && (
        <div className="ai-block" style={{ marginBottom: 20 }}>
          <span className="ai-tag">알림</span>
          <span style={{ fontSize: 14 }}>{error}</span>
        </div>
      )}

      {!loading && bookmarks.length > 0 && (
        <div className="row" style={{ marginBottom: 16 }}>
          <ChipRow>
            {(['최신순', '난이도순'] as BookmarkSortType[]).map((s) => (
              <Chip key={s} active={sort === s} onClick={() => setSort(s)}>{s}</Chip>
            ))}
          </ChipRow>
          <span className="muted" style={{ fontSize: 12 }}>{bookmarks.length}개</span>
        </div>
      )}

      {loading && (
        <Card><div className="muted">찜한 문제 목록을 불러오는 중입니다.</div></Card>
      )}

      {!loading && sorted.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <i className="bi bi-heart" style={{ fontSize: 36, color: 'var(--t3)' }} />
            <div className="muted" style={{ marginTop: 14, fontSize: 14 }}>아직 찜한 문제가 없습니다.</div>
            <div style={{ marginTop: 20 }}>
              <Button onClick={() => navigate('/learn/beginner/basic-terms')}>
                <i className="bi bi-play-fill" />
                문제 풀러 가기
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!loading && sorted.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {sorted.map((bookmark) => {
            const questionId = get_bookmark_question_id(bookmark)
            const text = get_bookmark_question_text(bookmark)
            const type = get_bookmark_question_type(bookmark)
            const levelId = get_bookmark_level_id(bookmark)
            const difficulty = get_bookmark_difficulty(levelId)
            const reward = get_bookmark_reward(bookmark)
            const key = questionId || get_bookmark_id(bookmark)

            return (
              <div
                key={key}
                className="quiz-mini available"
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => handle_quiz_click(bookmark)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="qm-num">Q{questionId} · {type === 'OX' ? 'OX' : '객관식'}</div>
                  <button
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                      color: 'var(--up)', opacity: removingId === questionId ? 0.4 : 1,
                    }}
                    onClick={(e) => void handle_remove(bookmark, e)}
                    disabled={removingId === questionId}
                    aria-label="찜 해제"
                    title="찜 해제"
                  >
                    <i className="bi bi-heart-fill" style={{ fontSize: 14 }} />
                  </button>
                </div>
                <div className="qm-q">{text || '(문제 텍스트 없음)'}</div>
                <div className="qm-foot">
                  <span>{difficulty}</span>
                  <Pill variant="primary">+{reward.toLocaleString()}원</Pill>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
