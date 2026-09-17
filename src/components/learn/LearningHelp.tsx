import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button'
import { api_complete_tutorial } from '../../api/learning'
import type { TutorialType } from '../../api/learning'

export interface SpotlightStep {
  target?: string
  title: string
  lines: string[]
}

interface LearningHelpProps {
  title: string
  description: string
  tutorialType: TutorialType
  steps: SpotlightStep[]
  autoStart?: boolean
  onComplete?: () => void
  onStartFullTutorial?: () => void
}

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
  radius: string
}

export const MAIN_TUTORIAL_STEPS: SpotlightStep[] = [
  {
    title: '투자 공부가 처음이어도 괜찮아요.',
    lines: ['StockMate가 현재 수준에 맞춰 하나씩 안내해드릴게요.'],
  },
  {
    target: 'learn-personalized',
    title: '무엇부터 공부해야 할지 고민하지 않아도 돼요.',
    lines: ['학습 기록과 수준을 바탕으로 나에게 맞는 학습을 추천해드려요.'],
  },
  {
    target: 'learn-levels',
    title: '원하는 난이도를 직접 선택할 수도 있어요.',
    lines: ['처음이라면 초급부터 천천히 시작해보세요.'],
  },
  {
    target: 'learn-content',
    title: '궁금한 투자 개념을 선택해서 학습해보세요.',
    lines: ['핵심 내용을 쉽고 짧게 정리해서 확인할 수 있어요.'],
  },
  {
    target: 'learn-concepts-link',
    title: '배운 내용을 다시 확인하고 싶다면 개념 정리를 이용해보세요.',
    lines: ['학습했던 투자 용어와 핵심 개념을 한곳에서 다시 볼 수 있어요.'],
  },
  {
    target: 'learn-quiz-entry',
    title: '배운 내용은 바로 문제로 확인할 수 있어요.',
    lines: ['퀴즈를 풀면서 이해한 내용을 점검해보세요.'],
  },
  {
    target: 'learn-progress',
    title: '학습할수록 나의 기록이 쌓여요.',
    lines: ['진행도를 확인하면서 하나씩 투자 지식을 채워보세요.'],
  },
]

export const HELP_STEPS: Record<TutorialType, SpotlightStep[]> = {
  INVESTMENT_LEARNING: MAIN_TUTORIAL_STEPS,
  PERSONALIZED_LEARNING: [
    {
      target: 'personalized-panel',
      title: '추천 학습을 여기서 만들 수 있어요.',
      lines: ['오답이나 궁금한 내용을 바탕으로 지금 필요한 문제를 준비해드려요.'],
    },
    {
      target: 'personalized-reason',
      title: '추천 이유를 확인해보세요.',
      lines: ['왜 이 문제가 나에게 필요한지 짧게 살펴보고 시작할 수 있어요.'],
    },
    {
      target: 'personalized-start',
      title: '마음에 드는 문제는 바로 풀어보세요.',
      lines: ['학습 시작 버튼처럼 카드를 누르면 퀴즈로 이어져요.'],
    },
  ],
  CONCEPT_SUMMARY: [
    {
      target: 'concept-level-filter',
      title: '보고 싶은 난이도만 골라볼 수 있어요.',
      lines: ['처음이라면 초급 개념부터 천천히 훑어보세요.'],
    },
    {
      target: 'concept-list',
      title: '개념 목록에서 궁금한 내용을 골라보세요.',
      lines: ['카드를 누르면 핵심 설명과 관련 퀴즈를 이어서 볼 수 있어요.'],
    },
  ],
  QUIZ: [
    {
      target: 'quiz-progress',
      title: '지금 어디까지 풀었는지 확인할 수 있어요.',
      lines: ['문제를 넘기며 차근차근 이해도를 점검해보세요.'],
    },
    {
      target: 'quiz-card',
      title: '배운 개념을 문제로 확인해보세요.',
      lines: ['헷갈리면 AI 설명으로 바로 다시 짚어볼 수 있어요.'],
    },
  ],
  LEARNING_PROGRESS: [
    {
      target: 'learn-progress',
      title: '완료한 학습과 정답률이 쌓여요.',
      lines: ['기록을 보면서 다음에 무엇을 공부할지 가볍게 정해보세요.'],
    },
  ],
}

export const HELP_DESCRIPTIONS: Record<TutorialType, string> = {
  INVESTMENT_LEARNING: 'StockMate의 투자 학습에서는 맞춤 학습, 개념 학습, 개념 정리, 퀴즈를 이용할 수 있습니다.',
  PERSONALIZED_LEARNING: '학습 기록과 수준을 기반으로 현재 사용자에게 적합한 투자 학습 콘텐츠를 추천합니다.',
  CONCEPT_SUMMARY: '학습한 투자 개념과 주요 용어를 다시 확인할 수 있는 공간입니다.',
  QUIZ: '학습한 내용을 문제로 확인하고 부족한 부분을 다시 학습할 수 있습니다.',
  LEARNING_PROGRESS: '완료한 학습, 퀴즈 결과, 현재 진행 상황을 확인할 수 있습니다.',
}

export default function LearningHelp({
  title,
  description,
  tutorialType,
  steps,
  autoStart = false,
  onComplete,
  onStartFullTutorial,
}: LearningHelpProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [active, setActive] = useState(autoStart)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const step = steps[index]

  useEffect(() => {
    if (autoStart) {
      setIndex(0)
      setActive(true)
    }
  }, [autoStart])

  useEffect(() => {
    if (!active || !step?.target) {
      setRect(null)
      return
    }
    const update = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`)
      if (!el) {
        setRect(null)
        return
      }
      const nextRect = () => {
        const bounds = el.getBoundingClientRect()
        setRect({
          top: bounds.top,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
          radius: getComputedStyle(el).borderRadius || '16px',
        })
      }
      nextRect()
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      setTimeout(nextRect, 260)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active, step])

  const popoverStyle = useMemo(() => {
    if (!rect) return undefined
    const gap = 14
    const width = 320
    const height = 180
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
    const positions = [
      { top: rect.top + rect.height / 2 - height / 2, left: rect.left + rect.width + gap },
      { top: rect.top + rect.height + gap, left: rect.left + rect.width / 2 - width / 2 },
      { top: rect.top + rect.height / 2 - height / 2, left: rect.left - width - gap },
      { top: rect.top - height - gap, left: rect.left + rect.width / 2 - width / 2 },
    ]
    const fit = positions.find((pos) =>
      pos.left >= 16 &&
      pos.top >= 16 &&
      pos.left + width <= window.innerWidth - 16 &&
      pos.top + height <= window.innerHeight - 16
    ) ?? positions[1]
    return {
      top: clamp(fit.top, 16, window.innerHeight - height - 16),
      left: clamp(fit.left, 16, window.innerWidth - width - 16),
    }
  }, [rect])

  const closeTutorial = () => {
    setActive(false)
    setIndex(0)
    void api_complete_tutorial(tutorialType)
    onComplete?.()
  }

  const startTutorial = () => {
    setHelpOpen(false)
    setIndex(0)
    setActive(true)
  }

  return (
    <>
      <button className="help-trigger" onClick={() => setHelpOpen((open) => !open)} aria-label={`${title} 도움말`}>
        <i className="bi bi-info-circle" />
      </button>

      {helpOpen && (
        <div className="help-card">
          <div className="help-card-title">{title} 안내</div>
          <p>{description}</p>
          <div className="help-actions">
            <Button size="sm" onClick={startTutorial}>이 페이지 사용법 보기</Button>
            {tutorialType !== 'INVESTMENT_LEARNING' && (
              <Button size="sm" variant="outline" onClick={() => {
                setHelpOpen(false)
                onStartFullTutorial?.()
              }}>
                전체 튜토리얼 다시 보기
              </Button>
            )}
          </div>
        </div>
      )}

      {active && step && (
        <div className={`tour-layer ${rect ? 'has-spotlight' : ''}`} role="dialog" aria-modal="true" aria-label="투자 학습 튜토리얼">
          {rect && <div className="tour-spotlight" style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: rect.radius,
          }} />}
          <div className="tour-box" style={popoverStyle}>
            <div className="tour-dots" aria-label={`${index + 1} / ${steps.length}`}>
              {steps.map((item, itemIndex) => (
                <i key={`${item.title}-${itemIndex}`} className={itemIndex <= index ? 'active' : ''} />
              ))}
            </div>
            <h2>{step.title}</h2>
            {step.lines.map((line) => <p key={line}>{line}</p>)}
            <div className="tour-actions">
              <button className="tour-text-button" onClick={index === 0 ? closeTutorial : () => setIndex((value) => value - 1)}>
                {index === 0 ? '건너뛰기' : '이전'}
              </button>
              <span className="tour-count">{index + 1} / {steps.length}</span>
              <button className="tour-primary-button" onClick={() => index === steps.length - 1 ? closeTutorial() : setIndex((value) => value + 1)}>
                {index === 0 ? '시작하기' : index === steps.length - 1 ? '완료' : '다음'} <i className="bi bi-arrow-right-short" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
