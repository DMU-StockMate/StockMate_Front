import { api } from './axios'

export type AiQuestionType = 'MULTIPLE_CHOICE' | 'OX'

export interface GenerateAiQuestionRequest {
  topicId: number
  investmentLevelId: number
  questionType: AiQuestionType
}

export type AiGenerationSource = 'WRONG_NOTE' | 'PROMPT'

export interface GenerateFromWrongNotesRequest {
  investmentLevelId?: number
  questionType?: AiQuestionType
}

export interface GenerateFromPromptRequest {
  prompt: string
  investmentLevelId?: number
  questionType?: AiQuestionType
}

export interface GeneratedAiChoice {
  choiceId: number
  choiceNo: number
  text: string
  isCorrect: boolean
}

export interface GeneratedAiQuestion {
  message: string
  questionId: number
  questionText: string
  questionType: AiQuestionType
  explanation: string
  rewardCash: number
  topic: string
  level: string
  choices: GeneratedAiChoice[]
  sourceType?: AiGenerationSource
  createdAt?: string
  [key: string]: unknown
}

export type AiSenderType = 'USER' | 'AI'

export interface AiChatMessageRecord {
  messageId: number
  senderType: AiSenderType
  messageText: string
  createdAt: string
}

export interface AiChatSessionRecord {
  sessionId: number
  questionId: number | null
  questionText: string | null
  sessionType: 'ANALYSIS' | 'FEEDBACK' | 'GENERAL'
  title: string
  preview: string
  createdAt: string
  updatedAt: string
  messages: AiChatMessageRecord[]
}

export type AiStreamEvent =
  | { type: 'session'; sessionId: number }
  | { type: 'token'; content: string }
  | { type: 'done'; sessionId: number }
  | { type: 'error'; message: string }

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api_generate_ai_question = (data: GenerateAiQuestionRequest) =>
  api.post<GeneratedAiQuestion>('/ai/questions/generate', data, { timeout: 30000 })

export const api_generate_question_from_wrong_notes = (data?: GenerateFromWrongNotesRequest) =>
  api.post<GeneratedAiQuestion>('/ai/questions/generate/wrong-notes', data, { timeout: 30000 })

export const api_generate_question_from_prompt = (data: GenerateFromPromptRequest) =>
  api.post<GeneratedAiQuestion>('/ai/questions/generate/prompt', data, { timeout: 30000 })

export const api_get_generated_questions = () =>
  api.get<GeneratedAiQuestion[] | { items?: GeneratedAiQuestion[] }>('/ai/questions/generated')

export const api_get_chat_sessions = (scope?: 'general' | 'question') =>
  api.get<AiChatSessionRecord[]>('/ai/chat-sessions', {
    params: scope ? { scope } : undefined,
  })

export const api_get_chat_session_messages = (sessionId: number) =>
  api.get<AiChatMessageRecord[]>(`/ai/chat-sessions/${sessionId}/messages`)

export async function api_stream_question_chat(
  questionId: number,
  message: string,
  onEvent: (event: AiStreamEvent) => void,
) {
  return stream_ai_response(`/ai/questions/${questionId}/chat/stream`, message, onEvent)
}

export async function api_stream_general_chat(
  message: string,
  onEvent: (event: AiStreamEvent) => void,
) {
  return stream_ai_response('/ai/chat/stream', message, onEvent)
}

export async function api_stream_chat_session(
  sessionId: number,
  message: string,
  onEvent: (event: AiStreamEvent) => void,
) {
  return stream_ai_response(`/ai/chat-sessions/${sessionId}/messages/stream`, message, onEvent)
}

async function stream_ai_response(
  path: string,
  message: string,
  onEvent: (event: AiStreamEvent) => void,
) {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `AI 응답 요청에 실패했습니다. (${response.status})`)
  }

  if (!response.body) {
    throw new Error('AI 스트리밍 응답을 읽을 수 없습니다.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    chunks.forEach((chunk) => {
      const dataLine = chunk
        .split('\n')
        .find((line) => line.startsWith('data: '))

      if (!dataLine) return

      const event = JSON.parse(dataLine.slice(6)) as AiStreamEvent
      if (event.type === 'error') {
        throw new Error(event.message || 'AI 서버 요청에 실패했습니다.')
      }
      onEvent(event)
    })
  }

  if (buffer.trim().startsWith('data: ')) {
    const event = JSON.parse(buffer.trim().slice(6)) as AiStreamEvent
    if (event.type === 'error') {
      throw new Error(event.message || 'AI 서버 요청에 실패했습니다.')
    }
    onEvent(event)
  }
}
