import Card from '../common/Card'
import Pill from '../common/Pill'
import { ChipRow } from '../common/Chip'
import type { AiGenerationSource } from '../../api/ai'
import type { GeneratedQuestionResult, GeneratedTab } from '../../hooks/useLearnCustom'

const SOURCE_LABEL: Record<AiGenerationSource, string> = {
  WRONG_NOTE: '오답 기반',
  PROMPT: '프롬프트 생성',
}

const SOURCE_PILL_VARIANT: Record<AiGenerationSource, 'accent' | 'primary'> = {
  WRONG_NOTE: 'accent',
  PROMPT: 'primary',
}

interface GeneratedQuestionListProps {
  questions: GeneratedQuestionResult[]
  tab: GeneratedTab
  onTabChange: (tab: GeneratedTab) => void
  wrongNoteCount: number
  promptCount: number
  onQuestionClick: (questionId: number) => void
}

export default function GeneratedQuestionList({
  questions,
  tab,
  onTabChange,
  wrongNoteCount,
  promptCount,
  onQuestionClick,
}: GeneratedQuestionListProps) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>생성된 문제</div>
        <ChipRow>
          <span className={`chip ${tab === 'ALL' ? 'active' : ''}`} onClick={() => onTabChange('ALL')}>
            전체 {wrongNoteCount + promptCount}
          </span>
          <span className={`chip ${tab === 'WRONG_NOTE' ? 'active' : ''}`} onClick={() => onTabChange('WRONG_NOTE')}>
            오답 기반 {wrongNoteCount}
          </span>
          <span className={`chip ${tab === 'PROMPT' ? 'active' : ''}`} onClick={() => onTabChange('PROMPT')}>
            프롬프트 생성 {promptCount}
          </span>
        </ChipRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {questions.length === 0 && (
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="muted">아직 생성된 문제가 없습니다. 위에서 문제를 생성해보세요.</div>
          </Card>
        )}
        {questions.map((question) => (
          <div key={question.questionId} className="quiz-mini" onClick={() => onQuestionClick(question.questionId)}>
            <div className="qm-num">Q{question.questionId} · {question.questionType === 'OX' ? 'OX' : '객관식'}</div>
            <div className="qm-q">{question.questionText}</div>
            <div className="qm-foot">
              <Pill variant={SOURCE_PILL_VARIANT[question.sourceType]}>{SOURCE_LABEL[question.sourceType]}</Pill>
              <Pill variant="success">+{question.rewardCash.toLocaleString()}원</Pill>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
