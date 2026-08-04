import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import { useInvestmentProfile } from '../hooks/useInvestmentProfile'
import { INVESTMENT_PROFILE_DISCLAIMER } from '../constants/riskProfile'

const CATEGORY_LABEL = {
  RISK: '투자성향 진단',
  KNOWLEDGE: '학습 수준 진단',
} as const

export default function OnboardingInvestmentProfilePage() {
  const {
    questions, answers, answeredCount, isComplete,
    submitting, error,
    handle_select, handle_submit,
  } = useInvestmentProfile()

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
