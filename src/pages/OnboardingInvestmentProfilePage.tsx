import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import { useInvestmentProfile } from '../hooks/useInvestmentProfile'
import { INVESTMENT_PROFILE_DISCLAIMER, RISK_TYPE_LABELS } from '../constants/riskProfile'
import { LEVEL_META } from '../hooks/useLearnLevel'
import type { InvestmentProfileResult } from '../api/investmentProfile'

const CATEGORY_LABEL = {
  RISK: '투자성향 진단',
  KNOWLEDGE: '학습 수준 진단',
} as const

const LEVEL_GUIDE = {
  beginner: {
    first: '기초 용어와 시장 구조부터 시작하세요.',
    guide: ['투자학습에서 초급 코스를 먼저 풀기', '모의투자는 소액 주문으로 주문 흐름 익히기', '관심 종목은 3개 안팎으로만 담아보기'],
  },
  intermediate: {
    first: '재무제표와 가치평가 문제부터 이어가면 좋아요.',
    guide: ['중급 코스에서 PER, PBR, ROE 개념 복습', '종목 상세에서 재무/뉴스를 같이 확인', '모의투자 내역으로 매매 이유 돌아보기'],
  },
  advanced: {
    first: '전략과 포트폴리오 관점으로 학습을 넓혀보세요.',
    guide: ['고급 코스에서 거시경제와 포트폴리오 문제 풀기', '랭킹전으로 성과를 비교하며 전략 점검', 'AI 분석으로 투자 가설 검토하기'],
  },
} as const

const RISK_GUIDE: Record<string, string> = {
  CONSERVATIVE: '손실 관리가 중요한 성향이에요. 안정적인 기준을 먼저 세우고 천천히 학습하세요.',
  MODERATE_CONSERVATIVE: '안정성을 우선하되 일부 성장 기회를 볼 수 있어요. 기초와 리스크 관리를 같이 가져가면 좋습니다.',
  BALANCED: '수익과 위험의 균형을 보는 성향이에요. 지표 분석과 모의투자를 병행하기 좋습니다.',
  AGGRESSIVE: '성장 기회를 적극적으로 찾는 성향이에요. 매매 전 근거를 숫자로 확인하는 습관이 중요합니다.',
  VERY_AGGRESSIVE: '높은 변동성도 감수하는 성향이에요. 포트폴리오 분산과 손실 기준을 먼저 정해두세요.',
}

function ResultView({ result, onRetake }: { result: InvestmentProfileResult; onRetake: () => void }) {
  const navigate = useNavigate()
  const levelKey = result.learningProfile.recommendedLevel
  const level = LEVEL_META[levelKey] ?? LEVEL_META.beginner
  const levelGuide = LEVEL_GUIDE[levelKey] ?? LEVEL_GUIDE.beginner
  const riskLabel = RISK_TYPE_LABELS[result.riskProfile.type] ?? result.riskProfile.type

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="page-title">
        <div>
          <h1>진단 결과</h1>
          <div className="page-sub">지금 시작하기 좋은 학습 경로를 정리했어요</div>
        </div>
        <Button variant="outline" onClick={onRetake}>
          <i className="bi bi-arrow-counterclockwise" />
          다시 진단
        </Button>
      </div>

      <Card variant="hero" className="card-lg" style={{ marginBottom: 20 }}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="label">추천 학습</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>{level.title}</div>
            <div style={{ opacity: 0.86, marginTop: 6 }}>{levelGuide.first}</div>
          </div>
          <div className="lv-badge" style={{ width: 64, height: 64, borderRadius: 18, fontSize: 26, background: level.badgeBg }}>
            {level.badge}
          </div>
        </div>
      </Card>

      <div className="onboarding-result-grid">
        <Card>
          <div className="label">투자성향</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{riskLabel}</div>
          <p className="muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
            {RISK_GUIDE[result.riskProfile.type] ?? '학습 결과에 맞춰 투자 판단 기준을 차근차근 세워보세요.'}
          </p>
        </Card>
        <Card>
          <div className="label">웹사이트 가이드</div>
          <div className="onboarding-guide-list">
            {levelGuide.guide.map((item) => (
              <div key={item}><i className="bi bi-check2-circle" /> {item}</div>
            ))}
          </div>
        </Card>
      </div>

      <div className="action-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 20 }}>
        <div className="action-card" onClick={() => navigate(`/learn/${levelKey}`)}>
          <div className="ac-ico"><i className="bi bi-journal-text" /></div>
          <div className="ac-name">추천 학습 시작</div>
          <div className="ac-desc">{level.title}으로 이동</div>
        </div>
        <div className="action-card" onClick={() => navigate('/trade/stocks')}>
          <div className="ac-ico"><i className="bi bi-graph-up-arrow" /></div>
          <div className="ac-name">모의투자 둘러보기</div>
          <div className="ac-desc">종목을 보고 주문 흐름 익히기</div>
        </div>
        <div className="action-card" onClick={() => navigate('/ai')}>
          <div className="ac-ico"><i className="bi bi-cpu" /></div>
          <div className="ac-name">AI 분석 사용</div>
          <div className="ac-desc">궁금한 종목과 개념 질문하기</div>
        </div>
      </div>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>
        {INVESTMENT_PROFILE_DISCLAIMER}
      </p>
    </AppLayout>
  )
}

export default function OnboardingInvestmentProfilePage() {
  const {
    questions, answers, result, answeredCount, isComplete,
    submitting, error,
    handle_select, handle_submit, handle_reset,
  } = useInvestmentProfile()

  if (result) return <ResultView result={result} onRetake={handle_reset} />

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="page-title">
        <div>
          <h1>투자성향 및 학습 수준 진단</h1>
          <div className="page-sub">몇 가지 질문에 답하면 나에게 맞는 학습 코스를 추천해드려요</div>
        </div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="muted" style={{ fontSize: 12 }}>진행률</span>
          <span className="muted" style={{ fontSize: 12 }}>{answeredCount} / {questions.length}</span>
        </div>
        <Progress value={answeredCount} max={questions.length} />
      </Card>

      {questions.map((question, index) => {
        const showCategoryHeader = question.category !== questions[index - 1]?.category
        return (
          <div key={question.code}>
            {showCategoryHeader && (
              <div className="section-title" style={{ marginTop: 24, marginBottom: 12 }}>
                {CATEGORY_LABEL[question.category]}
              </div>
            )}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{question.text}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {question.options.map((option) => (
                  <div
                    key={option.code}
                    className={`gen-mode-card ${answers[question.code] === option.code ? 'active' : ''}`}
                    style={{ padding: '12px 16px' }}
                    onClick={() => handle_select(question.code, option.code)}
                  >
                    <div className="gen-mode-title" style={{ fontWeight: 500 }}>{option.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      })}

      {error && (
        <div className="ai-block" style={{ marginBottom: 20 }}>
          <span className="ai-tag">알림</span>
          <span style={{ fontSize: 14 }}>{error}</span>
        </div>
      )}

      <Button size="lg" block disabled={!isComplete || submitting} onClick={() => void handle_submit()}>
        {submitting ? '제출 중...' : '진단 완료하기'}
      </Button>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>
        {INVESTMENT_PROFILE_DISCLAIMER}
      </p>
    </AppLayout>
  )
}
