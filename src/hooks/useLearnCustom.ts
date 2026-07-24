import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api_generate_from_prompt,
  api_generate_from_wrong_notes,
  type AiGenerationSource,
  type GeneratedQuestionItem,
} from '../api/ai'
import { api_get_wrong_notes, type QuizAttempt } from '../api/learning'
import { get_community_error_message } from '../utils/community'

export type GenerationMode = AiGenerationSource

export interface GeneratedQuestionResult extends GeneratedQuestionItem {
  sourceType: AiGenerationSource
}

export type GeneratedTab = 'ALL' | AiGenerationSource

const MAX_WRONG_QUESTION_IDS = 50

// 백엔드에 학습 주제 목록 조회 API가 없어 프롬프트 생성 시 저장용 topicId를 고정값으로 사용한다.
const DEFAULT_TOPIC_ID = 1

const get_wrong_note_question_id = (attempt: QuizAttempt) =>
  Number(attempt.question_id ?? attempt.questionId ?? attempt.question?.question_id ?? attempt.question?.questionId ?? 0)

export function useLearnCustom() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<GenerationMode>('WRONG_NOTE')
  const [prompt, setPrompt] = useState('')
  const [promptError, setPromptError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [questions, setQuestions] = useState<GeneratedQuestionResult[]>([])
  const [tab, setTab] = useState<GeneratedTab>('ALL')

  const handle_generate = useCallback(async () => {
    if (mode === 'PROMPT' && !prompt.trim()) {
      setPromptError('프롬프트를 입력해주세요')
      return
    }
    setPromptError('')
    setGenerateError('')
    setGenerating(true)
    try {
      let batch: GeneratedQuestionItem[]

      if (mode === 'WRONG_NOTE') {
        const { data: wrongNotes } = await api_get_wrong_notes()
        const questionIds = Array.from(new Set(wrongNotes.map(get_wrong_note_question_id).filter((id) => id > 0)))
          .slice(0, MAX_WRONG_QUESTION_IDS)

        if (questionIds.length === 0) {
          setGenerateError('아직 오답 기록이 없습니다. 문제를 먼저 풀어본 뒤 다시 시도해주세요.')
          return
        }

        const { data } = await api_generate_from_wrong_notes({ questionIds })
        batch = data.questions
      } else {
        const { data } = await api_generate_from_prompt({ prompt: prompt.trim(), topicId: DEFAULT_TOPIC_ID })
        batch = data.questions
      }

      const tagged = batch.map((question) => ({ ...question, sourceType: mode }))
      setQuestions((prev) => [...tagged, ...prev])
      if (mode === 'PROMPT') setPrompt('')
    } catch (err) {
      setGenerateError(
        mode === 'WRONG_NOTE'
          ? get_community_error_message(err, '오답 기반 문제 생성에 실패했습니다.')
          : get_community_error_message(err, 'AI 문제 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'),
      )
    } finally {
      setGenerating(false)
    }
  }, [mode, prompt])

  const filteredQuestions = tab === 'ALL' ? questions : questions.filter((q) => q.sourceType === tab)
  const wrongNoteCount = questions.filter((q) => q.sourceType === 'WRONG_NOTE').length
  const promptCount = questions.filter((q) => q.sourceType === 'PROMPT').length

  const handle_question_click = (questionId: number) => navigate(`/learn/quiz/basic-terms/${questionId}`)

  return {
    mode, setMode,
    prompt, setPrompt,
    promptError,
    generating, generateError,
    questions, filteredQuestions,
    wrongNoteCount, promptCount,
    tab, setTab,
    handle_generate,
    handle_question_click,
  }
}
