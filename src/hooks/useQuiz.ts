import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  api_add_bookmark,
  api_delete_bookmark,
  api_get_bookmarks,
  api_get_question,
  api_get_questions,
  api_submit_answer,
  type QuizChoice,
} from '../api/learning'
import { api_stream_chat_session, api_stream_question_chat } from '../api/ai'
import { as_record, get_array } from '../utils/normalize'

export type QuizType = 'multiple' | 'ox'
type AiRole = 'assistant' | 'user'

export interface QuizItem {
  id: number
  type: QuizType
  question: string
  options: string[]
  choiceIds: number[]
  correctIndex: number
  tag: string
  difficulty: '쉬움' | '보통' | '어려움'
  reward: number
  explanation: string | null
}

export interface AiMessage {
  id: number
  role: AiRole
  text: string
}

const get_question_id = (raw: unknown) => {
  const item = as_record(raw)
  return Number(item.question_id ?? item.questionId ?? 0)
}

const get_choice_id = (choice: QuizChoice, index: number) =>
  Number(choice.choice_id ?? choice.choiceId ?? choice.id ?? index + 1)

const normalize_question = (raw: unknown): QuizItem | null => {
  const question = as_record(raw)
  const choices = Array.isArray(question.choices) ? question.choices as QuizChoice[] : []
  const id = get_question_id(question)
  const questionText = String(question.question_text ?? question.questionText ?? '')
  if (!id || !questionText || choices.length === 0) return null

  const typeText = String(question.question_type ?? question.questionType ?? '')
  const levelId = Number(question.investment_level_id ?? question.investmentLevelId ?? 1)
  const correctIndex = choices.findIndex((c) => c.is_correct === true || c.isCorrect === true)

  return {
    id,
    type: typeText === 'OX' ? 'ox' : 'multiple',
    question: questionText,
    options: choices.map((c, i) => String(c.choice_text ?? c.text ?? `선택지 ${i + 1}`)),
    choiceIds: choices.map(get_choice_id),
    correctIndex,
    tag: String(question.topicName ?? question.topic ?? '투자 학습'),
    difficulty: levelId > 2 ? '어려움' : levelId > 1 ? '보통' : '쉬움',
    reward: Number(question.reward_cash ?? question.rewardCash ?? 0),
    explanation: typeof question.explanation === 'string' ? question.explanation : null,
  }
}

const get_ai_intro = (quiz: QuizItem) =>
  `${quiz.id}번 문제를 같이 볼게요.\n\n` +
  `문제: ${quiz.question}\n\n` +
  `이 문제는 ${quiz.type === 'multiple' ? '4지선다' : 'OX'} 형식입니다. 헷갈리는 보기를 말해주면 문제 맥락을 기준으로 설명해드릴게요.`

export function useQuiz() {
  const { topicId = '1', questionId = '' } = useParams<{ topicId: string; questionId: string }>()
  const navigate = useNavigate()
  const requestedQuestionId = Number.parseInt(questionId, 10)

  const [quiz, setQuiz] = useState<QuizItem | null>(null)
  const [questions, setQuestions] = useState<QuizItem[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ correct: boolean; reward: number; explanation: string | null } | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [aiSessionId, setAiSessionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [aiSending, setAiSending] = useState(false)
  const nextAiMessageIdRef = useRef(1)

  const sync_question = useCallback((nextQuiz: QuizItem) => {
    setQuiz(nextQuiz)
    setSelected(null)
    setSubmitted(false)
    setSubmitResult(null)
    setAiOpen(false)
    setAiInput('')
    setAiSessionId(null)
    setAiMessages([{ id: nextAiMessageIdRef.current, role: 'assistant', text: get_ai_intro(nextQuiz) }])
    nextAiMessageIdRef.current += 1
  }, [])

  useEffect(() => {
    let alive = true

    const load_question = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api_get_questions({ topicId: Number(topicId) })
        const loaded = get_array(data)
          .map(normalize_question)
          .filter((item): item is QuizItem => item !== null)
          .sort((a, b) => a.id - b.id)

        let nextQuiz: QuizItem | null = loaded.find((q) => q.id === requestedQuestionId) ?? null

        if (!nextQuiz && requestedQuestionId > 0) {
          const detail = await api_get_question(requestedQuestionId)
          nextQuiz = normalize_question(detail.data)
        }

        if (!alive) return

        setQuestions(nextQuiz && !loaded.some((item) => item.id === nextQuiz!.id)
          ? [...loaded, nextQuiz].sort((a, b) => a.id - b.id)
          : loaded)

        if (nextQuiz) {
          sync_question(nextQuiz)
        } else if (loaded[0]) {
          sync_question(loaded[0])
          navigate(`/learn/quiz/${topicId}/${loaded[0].id}`, { replace: true })
        } else {
          setQuiz(null)
          setAiMessages([])
          setError('표시할 문제가 없습니다. AI 문제 생성 후 다시 시도해주세요.')
        }
      } catch {
        if (!alive) return
        setQuiz(null)
        setQuestions([])
        setAiMessages([])
        setError('문제 API 연결에 실패했습니다. 로그인 상태와 백엔드 서버를 확인해주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load_question()
    return () => { alive = false }
  }, [questionId, requestedQuestionId, topicId, navigate, sync_question])

  useEffect(() => {
    if (!quiz) return
    let alive = true
    api_get_bookmarks()
      .then(({ data }) => {
        if (!alive) return
        setBookmarked(data.some((b) => get_question_id(b.question ?? b) === quiz.id))
      })
      .catch(() => { if (alive) setBookmarked(false) })
    return () => { alive = false }
  }, [quiz])

  const currentIndex = quiz ? questions.findIndex((q) => q.id === quiz.id) : -1
  const progressPct = Math.round(((currentIndex >= 0 ? currentIndex + 1 : 0) / Math.max(questions.length, 1)) * 100)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < questions.length - 1

  const handle_next = useCallback(() => {
    const nextQuiz = questions[currentIndex + 1]
    if (nextQuiz) {
      sync_question(nextQuiz)
      navigate(`/learn/quiz/${topicId}/${nextQuiz.id}`)
      return
    }
    navigate(`/learn/beginner/${topicId}`)
  }, [questions, currentIndex, topicId, navigate, sync_question])

  const handle_prev = useCallback(() => {
    const prevQuiz = questions[currentIndex - 1]
    if (!prevQuiz) return
    sync_question(prevQuiz)
    navigate(`/learn/quiz/${topicId}/${prevQuiz.id}`)
  }, [questions, currentIndex, topicId, navigate, sync_question])

  const handle_bookmark_toggle = useCallback(async () => {
    if (!quiz || bookmarkSaving) return
    setBookmarkSaving(true)
    try {
      if (bookmarked) {
        await api_delete_bookmark(quiz.id)
        setBookmarked(false)
      } else {
        await api_add_bookmark(quiz.id)
        setBookmarked(true)
      }
    } catch {
      setError('찜 처리에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setBookmarkSaving(false)
    }
  }, [quiz, bookmarked, bookmarkSaving])

  const handle_submit = useCallback(async () => {
    if (!quiz || selected === null) return
    const selectedChoiceId = quiz.choiceIds[selected]
    if (!selectedChoiceId) return
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api_submit_answer(quiz.id, selectedChoiceId)
      setSubmitResult({ correct: data.correct, reward: data.reward, explanation: data.explanation })
      setSubmitted(true)
    } catch {
      setError('정답 제출에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }, [quiz, selected])

  const send_ai_message = useCallback(async (text: string) => {
    if (!quiz) return
    const value = text.trim()
    if (!value || aiSending) return

    const userMessage: AiMessage = { id: nextAiMessageIdRef.current, role: 'user', text: value }
    nextAiMessageIdRef.current += 1
    const assistantId = nextAiMessageIdRef.current
    nextAiMessageIdRef.current += 1

    setAiMessages((prev) => [...prev, userMessage, { id: assistantId, role: 'assistant', text: '' }])
    setAiInput('')
    setAiSending(true)

    try {
      const onEvent = (event: { type: string; sessionId?: number; content?: string }) => {
        if (event.type === 'session' && event.sessionId) setAiSessionId(event.sessionId)
        if (event.type === 'done' && event.sessionId) setAiSessionId(event.sessionId)
        if (event.type !== 'token') return
        setAiMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, text: `${m.text}${event.content ?? ''}` } : m,
        ))
      }
      if (aiSessionId) {
        await api_stream_chat_session(aiSessionId, value, onEvent)
      } else {
        await api_stream_question_chat(quiz.id, value, onEvent)
      }
    } catch {
      setAiMessages((prev) => prev.map((m) =>
        m.id === assistantId ? { ...m, text: 'AI 설명 API 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' } : m,
      ))
    } finally {
      setAiSending(false)
    }
  }, [quiz, aiSending, aiSessionId])

  const handle_ai_key_down = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send_ai_message(aiInput)
    }
  }, [send_ai_message, aiInput])

  return {
    quiz, questions, selected, setSelected,
    submitted, submitResult,
    bookmarked, bookmarkSaving,
    aiOpen, setAiOpen,
    aiInput, setAiInput,
    aiMessages, aiSending,
    loading, error,
    submitting,
    topicId,
    currentIndex, progressPct, hasPrev, hasNext,
    handle_next, handle_prev,
    handle_bookmark_toggle, handle_submit,
    send_ai_message, handle_ai_key_down,
  }
}
