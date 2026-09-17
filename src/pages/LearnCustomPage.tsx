import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import GenerationPanel from '../components/learn/GenerationPanel'
import GeneratedQuestionList from '../components/learn/GeneratedQuestionList'
import LearningHelp, { HELP_DESCRIPTIONS, HELP_STEPS } from '../components/learn/LearningHelp'
import { useLearnCustom } from '../hooks/useLearnCustom'

export default function LearnCustomPage() {
  const navigate = useNavigate()
  const {
    mode, setMode,
    prompt, setPrompt,
    promptError,
    generating, generateError,
    filteredQuestions,
    wrongNoteCount, promptCount,
    tab, setTab,
    handle_generate,
    handle_question_click,
  } = useLearnCustom()

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">개인 맞춤 학습</span>
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className="lv-badge"
            style={{ width: 56, height: 56, borderRadius: 16, fontSize: 24, background: 'linear-gradient(135deg, #EC4899, #F59E0B)' }}
          >
            AI
          </div>
          <div>
            <h1 className="title-with-help">
              개인 맞춤 학습
              <LearningHelp
                title="개인 맞춤 학습"
                description={HELP_DESCRIPTIONS.PERSONALIZED_LEARNING}
                tutorialType="PERSONALIZED_LEARNING"
                steps={HELP_STEPS.PERSONALIZED_LEARNING}
                onStartFullTutorial={() => navigate('/learn', { state: { startTutorial: true } })}
              />
            </h1>
            <div className="page-sub">오답 복습과 프롬프트 요청으로 나만의 문제를 만들어보세요</div>
          </div>
        </div>
      </div>

      <div data-tour="personalized-panel" style={{ marginBottom: 28 }}>
        <GenerationPanel
          mode={mode}
          onModeChange={setMode}
          prompt={prompt}
          onPromptChange={setPrompt}
          promptError={promptError}
          generateError={generateError}
          generating={generating}
          onGenerate={() => void handle_generate()}
        />
      </div>

      <div data-tour="personalized-start">
        <div data-tour="personalized-reason">
          <GeneratedQuestionList
            questions={filteredQuestions}
            tab={tab}
            onTabChange={setTab}
            wrongNoteCount={wrongNoteCount}
            promptCount={promptCount}
            onQuestionClick={handle_question_click}
          />
        </div>
      </div>
    </AppLayout>
  )
}
