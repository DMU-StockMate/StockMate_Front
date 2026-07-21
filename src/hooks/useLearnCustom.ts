import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api_generate_question_from_prompt,
  api_generate_question_from_wrong_notes,
  api_get_generated_questions,
  type AiGenerationSource,
  type GeneratedAiQuestion,
} from '../api/ai'
import { as_record, get_array } from '../utils/normalize'

export type GenerationMode = AiGenerationSource
export type GeneratedTab = 'ALL' | AiGenerationSource

const normalize_generated_question = (raw: unknown): GeneratedAiQuestion | null => {
  const item = as_record(raw)
  const questionId = Number(item.questionId ?? item.question_id ?? 0)
  const questionText = String(item.questionText ?? item.question_text ?? '')
  if (!questionId || !questionText) return null

  const sourceRaw = String(item.sourceType ?? item.source_type ?? item.generationType ?? item.generation_type ?? '').toUpperCase()
  const sourceType: AiGenerationSource | undefined = sourceRaw === 'WRONG_NOTE' ? 'WRONG_NOTE' : sourceRaw === 'PROMPT' ? 'PROMPT' : undefined

  return {
    message: String(item.message ?? ''),
    questionId,
    questionText,
    questionType: (item.questionType ?? item.question_type) === 'OX' ? 'OX' : 'MULTIPLE_CHOICE',
    explanation: String(item.explanation ?? ''),
    rewardCash: Number(item.rewardCash ?? item.reward_cash ?? 0),
    topic: String(item.topic ?? ''),
    level: String(item.level ?? ''),
    choices: Array.isArray(item.choices) ? item.choices as GeneratedAiQuestion['choices'] : [],
    sourceType,
    createdAt: String(item.createdAt ?? item.created_at ?? ''),
  }
}

export function useLearnCustom() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<GenerationMode>('WRONG_NOTE')
  const [prompt, setPrompt] = useState('')
  const [promptError, setPromptError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [questions, setQuestions] = useState<GeneratedAiQuestion[]>([])
  const [tab, setTab] = useState<GeneratedTab>('ALL')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api_get_generated_questions()
      const items = get_array(data)
        .map(normalize_generated_question)
        .filter((item): item is GeneratedAiQuestion => item !== null)
      setQuestions(items)
    } catch {
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  const handle_generate = useCallback(async () => {
    if (mode === 'PROMPT' && !prompt.trim()) {
      setPromptError('프롬프트를 입력해주세요')
      return
    }
    setPromptError('')
    setGenerateError('')
    setGenerating(true)
    try {
      const { data } = mode === 'WRONG_NOTE'
        ? await api_generate_question_from_wrong_notes()
        : await api_generate_question_from_prompt({ prompt: prompt.trim() })

      const tagged: GeneratedAiQuestion = { ...data, sourceType: data.sourceType ?? mode }
      setQuestions((prev) => [tagged, ...prev])
      if (mode === 'PROMPT') setPrompt('')
    } catch {
      setGenerateError(
        mode === 'WRONG_NOTE'
          ? '오답 기반 문제 생성에 실패했습니다. 오답 노트가 있는지 확인해주세요.'
          : 'AI 문제 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
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
    loading,
    handle_generate,
    handle_question_click,
  }
}
