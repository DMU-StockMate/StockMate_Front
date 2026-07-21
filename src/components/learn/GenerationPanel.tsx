import Card from '../common/Card'
import Button from '../common/Button'
import Textarea from '../common/Textarea'
import type { GenerationMode } from '../../hooks/useLearnCustom'

interface ModeOption {
  mode: GenerationMode
  icon: string
  title: string
  desc: string
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'WRONG_NOTE',
    icon: 'bi-arrow-repeat',
    title: '오답 기반 생성',
    desc: '최근 틀린 문제를 분석해 비슷한 유형의 새 문제를 만들어드려요.',
  },
  {
    mode: 'PROMPT',
    icon: 'bi-chat-square-text',
    title: '프롬프트로 생성',
    desc: '원하는 주제나 조건을 입력하면 그에 맞는 문제를 생성해드려요.',
  },
]

interface GenerationPanelProps {
  mode: GenerationMode
  onModeChange: (mode: GenerationMode) => void
  prompt: string
  onPromptChange: (value: string) => void
  promptError: string
  generateError: string
  generating: boolean
  onGenerate: () => void
}

export default function GenerationPanel({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  promptError,
  generateError,
  generating,
  onGenerate,
}: GenerationPanelProps) {
  return (
    <Card>
      <div className="section-title" style={{ marginBottom: 14 }}>문제 생성 방식 선택</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 18 }}>
        {MODE_OPTIONS.map((option) => (
          <div
            key={option.mode}
            className={`gen-mode-card ${mode === option.mode ? 'active' : ''}`}
            onClick={() => onModeChange(option.mode)}
          >
            <div className="gen-mode-icon"><i className={`bi ${option.icon}`} /></div>
            <div className="gen-mode-title">{option.title}</div>
            <div className="gen-mode-desc">{option.desc}</div>
          </div>
        ))}
      </div>

      {mode === 'PROMPT' && (
        <div style={{ marginBottom: 16 }}>
          <Textarea
            label="프롬프트"
            placeholder="예: 배당주 투자 시 확인해야 할 지표를 다루는 객관식 문제를 만들어줘"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            error={promptError}
            style={{ minHeight: 100 }}
          />
        </div>
      )}

      {generateError && (
        <div className="ai-block">
          <span className="ai-tag">알림</span>
          <span style={{ fontSize: 14 }}>{generateError}</span>
        </div>
      )}

      <Button size="lg" block disabled={generating} onClick={onGenerate}>
        <i className="bi bi-stars" />
        {generating ? '생성 중...' : '문제 생성하기'}
      </Button>
    </Card>
  )
}
