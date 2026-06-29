import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import Progress from '../components/common/Progress'
import {
  useLearnPage,
  get_attempt_question_text,
  get_attempt_time,
  get_attempt_reward,
  get_bookmark_question_id,
  get_bookmark_question_text,
  get_bookmark_topic_slug,
} from '../hooks/useLearnPage'

const LEVELS = [
  {
    id: 'beginner', badge: '초', badgeBg: '#10B981', className: 'beginner',
    title: '초급 학습', desc: '투자가 처음이라면 여기서 시작.\n기초 용어와 시장 구조부터.',
    tags: ['기초 용어', '차트 기초', '시장 이해'], locked: false,
  },
  {
    id: 'intermediate', badge: '중', badgeBg: '#3B82F6', className: 'intermediate',
    title: '중급 학습', desc: '핵심 지표 분석과 실전.\n가치평가, 산업 분석까지.',
    tags: ['재무제표', '가치평가', '산업 분석'], locked: false,
  },
  {
    id: 'advanced', badge: '고', badgeBg: '#6D29D9', className: 'advanced',
    title: '고급 학습', desc: '심화된 전략과 분석.\n거시경제, 옵션, 포트폴리오.',
    tags: ['거시경제', '옵션', '포트폴리오'], locked: false,
  },
  {
    id: 'custom', badge: 'AI', badgeBg: 'linear-gradient(135deg, #EC4899, #F59E0B)', className: 'custom',
    title: '개인 맞춤 학습', desc: 'AI가 분석한 약점 보강.\n생성 문제로 바로 복습.',
    tags: ['오답 복습', 'AI 생성 문제'], locked: false,
  },
]

export default function LearnPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    stats, questionCount, bookmarks, recentHistories,
    loading, accuracy, progressValue, remainingForNextLevel,
    handle_navigate_bookmark,
  } = useLearnPage()

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="page-title">
        <div>
          <h1>투자학습</h1>
          <div className="page-sub">수준에 맞춘 학습 코스를 선택해 자금을 모아보세요</div>
        </div>
        <Button variant="outline">등급 재진단</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card variant="hero" className="card-lg">
          <div className="row">
            <div>
              <Pill variant="outline-light">현재 등급</Pill>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>
                {user?.level ?? '초급 Lv.1'} · 정답률 {loading ? '-' : `${accuracy}%`}
              </div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>
                누적 {stats?.total ?? 0}문제 · 정답 {stats?.correct ?? 0}문제
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>다음 등급까지</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{remainingForNextLevel}문제</div>
            </div>
          </div>
          <Progress value={progressValue} variant="hero" style={{ marginTop: 18 }} />
          <div style={{ opacity: 0.85, fontSize: 12, marginTop: 8 }}>실제 학습 통계 API 기준</div>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 12 }}>
            <Pill variant="accent">학습 현황</Pill>
            <span className="muted" style={{ fontSize: 12 }}>{stats?.total ?? 0} / {questionCount}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>등록 문제 {questionCount}개</div>
          <div className="muted" style={{ marginTop: 4 }}>정답 {stats?.correct ?? 0} · 오답 {stats?.wrong ?? 0}</div>
          <Progress value={stats?.total ?? 0} max={Math.max(questionCount, 1)} style={{ marginTop: 16 }} />
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>풀이 진행률</span>
            <Button size="sm" onClick={() => navigate('/learn/beginner/basic-terms')}>
              <i className="bi bi-play-fill" />
              학습 시작
            </Button>
          </div>
          <Button variant="outline" size="sm" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate('/learn/ai-history')}>
            <i className="bi bi-chat-square-text" />
            AI 질문 기록 보기
          </Button>
          <Button variant="outline" size="sm" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/learn/bookmarks')}>
            <i className="bi bi-heart" />
            찜한 문제 보기
          </Button>
        </Card>
      </div>

      <div className="section-title" style={{ marginBottom: 14 }}>학습 코스 선택</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {LEVELS.map((lv) => (
          <div
            key={lv.id}
            className={`level-card ${lv.className}`}
            onClick={() => !lv.locked && navigate(`/learn/${lv.id}`)}
            style={lv.locked ? { cursor: 'not-allowed' } : {}}
          >
            <div className="lv-badge" style={{ background: lv.badgeBg }}>{lv.badge}</div>
            <div>
              <div className="lv-title">{lv.title}</div>
              <div className="lv-desc" style={{ marginTop: 6 }}>
                {lv.desc.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
              </div>
            </div>
            <div className="lv-tags">
              {lv.tags.map((tag) => <span key={tag} className="lv-tag">{tag}</span>)}
            </div>
            <div className="lv-foot">
              <span>{questionCount}문제</span>
              <span className="pct" style={{ color: 'var(--primary)' }}>API 연동</span>
            </div>
          </div>
        ))}
      </div>

      <Card style={{ marginTop: 24 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>최근 학습</div>
          <span style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate('/mypage')}>
            전체 기록 →
          </span>
        </div>
        {loading && <div className="muted">학습 기록을 불러오는 중입니다.</div>}
        {!loading && recentHistories.length === 0 && <div className="muted">아직 학습 기록이 없습니다.</div>}
        {!loading && recentHistories.map((item) => {
          const correct = item.is_correct ?? item.isCorrect ?? false
          const reward = get_attempt_reward(item)
          return (
            <div key={`${item.question_id ?? item.questionId}-${get_attempt_time(item)}`} className="activity-row">
              <div className="left">
                <Pill variant={correct ? 'success' : 'warning'}>{correct ? '완료' : '오답'}</Pill>
                <span>{get_attempt_question_text(item)}</span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {get_attempt_time(item) || '-'}{reward > 0 ? ` · +${reward.toLocaleString()}원` : ''}
              </span>
            </div>
          )
        })}
      </Card>

      <Card style={{ marginTop: 20 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>찜한 문제</div>
            {bookmarks.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(239,68,68,0.1)', color: 'var(--up)',
              }}>
                {bookmarks.length}
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate('/learn/bookmarks')}>
            전체 보기 →
          </span>
        </div>
        {loading && <div className="muted">찜한 문제를 불러오는 중입니다.</div>}
        {!loading && bookmarks.length === 0 && (
          <div className="muted">아직 찜한 문제가 없습니다. 문제 풀이 중 하트 버튼으로 추가하세요.</div>
        )}
        {!loading && bookmarks.slice(0, 4).map((bookmark) => {
          const questionId = get_bookmark_question_id(bookmark)
          const text = get_bookmark_question_text(bookmark)
          const topicSlug = get_bookmark_topic_slug(bookmark)
          return (
            <div
              key={questionId}
              className="activity-row"
              style={{ cursor: 'pointer' }}
              onClick={() => handle_navigate_bookmark(bookmark)}
            >
              <div className="left">
                <Pill variant="warning">
                  <i className="bi bi-heart-fill" style={{ fontSize: 10 }} />
                  찜
                </Pill>
                <span>{text || `Q${questionId}`}</span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>바로 풀기 →</span>
            </div>
          )
        })}
        {!loading && bookmarks.length > 4 && (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/learn/bookmarks')}>
              나머지 {bookmarks.length - 4}개 더 보기
            </Button>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
