import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'
import Progress from '../components/common/Progress'
import Input from '../components/common/Input'
import ConfirmModal from '../components/common/ConfirmModal'
import { useMyPage } from '../hooks/useMyPage'

const MENU = [
  { icon: 'bi-person-gear', label: '개인정보 변경', path: '/mypage/edit' },
  { icon: 'bi-bar-chart-line', label: '투자성향·학습 수준 재진단', path: '/onboarding/investment-profile' },
  { icon: 'bi-heart', label: '찜한 문제', path: '/learn/bookmarks' },
  { icon: 'bi-clock-history', label: '모의투자 내역', path: '/trade/history' },
  { icon: 'bi-gear', label: '설정' },
]

export default function MyPage() {
  const navigate = useNavigate()
  const {
    user, stats, streakDays, riskTypeLabel,
    handle_logout,
    withdrawOpen, withdrawPassword, setWithdrawPassword, withdrawError, withdrawLoading,
    handle_open_withdraw, handle_close_withdraw, handle_withdraw,
  } = useMyPage()

  return (
    <AppLayout topbarPlaceholder="검색">
      <div className="page-title">
        <div>
          <h1>마이페이지</h1>
          <div className="page-sub">계정과 활동을 관리하세요</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <div className="row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div className="avatar" style={{ width: 80, height: 80 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{user?.name ?? '사용자'}</div>
                <div className="muted" style={{ marginTop: 4 }}>{user?.email ?? '-'}</div>
                {user?.nickname && (
                  <div className="muted" style={{ marginTop: 2, fontSize: 12 }}>@{user.nickname}</div>
                )}
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Pill>{user?.level ?? '초급 Lv.1'}</Pill>
                  {riskTypeLabel ? (
                    <Pill variant="gray">{riskTypeLabel}</Pill>
                  ) : (
                    <Pill variant="gray" style={{ cursor: 'pointer' }} onClick={() => navigate('/onboarding/investment-profile')}>
                      투자성향 진단하기
                    </Pill>
                  )}
                  {streakDays > 0 && <Pill variant="accent">{streakDays}일 연속 학습 중</Pill>}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/mypage/edit')}>
              <i className="bi bi-pencil" />
              프로필 편집
            </Button>
          </div>
        </Card>

        <Card variant="hero">
          <div className="label">현재 등급</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{user?.level ?? '초급 Lv.1'}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
            {stats ? `다음 등급까지 ${Math.max(0, 50 - stats.correct)}문제` : '다음 등급까지 -'}
          </div>
          <Progress value={stats ? Math.min(100, stats.correct * 2) : 0} variant="hero" style={{ marginTop: 14 }} />
        </Card>
      </div>

      {stats && (
        <Card style={{ marginBottom: 20 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>학습 통계</div>
            <span className="muted" style={{ fontSize: 12 }}>정답률 {stats.accuracy}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { num: stats.total, lbl: '총 문제 수' },
              { num: stats.correct, lbl: '정답', cls: 'price-up' },
              { num: stats.wrong, lbl: '오답', cls: 'price-down' },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }} className={s.cls}>{s.num}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="menu-list">
        {MENU.map((item) => (
          <div
            key={item.label}
            className="menu-row"
            onClick={item.path ? () => navigate(item.path) : undefined}
            style={item.path ? { cursor: 'pointer' } : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className={`bi ${item.icon}`} style={{ fontSize: 16, color: 'var(--t2)' }} />
              {item.label}
            </div>
            <i className="bi bi-chevron-right" style={{ color: 'var(--t3)' }} />
          </div>
        ))}
        <div className="menu-row" style={{ color: 'var(--up)' }} onClick={handle_logout}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-box-arrow-right" style={{ fontSize: 16 }} />
            로그아웃
          </div>
        </div>
        <div className="menu-row" style={{ color: 'var(--down)' }} onClick={handle_open_withdraw}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="bi bi-person-x" style={{ fontSize: 16 }} />
            회원 탈퇴
          </div>
        </div>
      </div>

      <ConfirmModal
        open={withdrawOpen}
        title="정말 탈퇴하시겠어요?"
        message="탈퇴 시 계정 정보와 학습 기록에 다시 접근할 수 없습니다. 계속하려면 비밀번호를 입력해주세요."
        confirmText={withdrawLoading ? '처리 중...' : '탈퇴하기'}
        cancelText="취소"
        confirmDisabled={withdrawLoading}
        onConfirm={handle_withdraw}
        onCancel={handle_close_withdraw}
      >
        <Input
          type="password"
          placeholder="비밀번호"
          value={withdrawPassword}
          onChange={(e) => setWithdrawPassword(e.target.value)}
          error={withdrawError}
          autoFocus
        />
      </ConfirmModal>
    </AppLayout>
  )
}
