import { useEffect, useMemo, useState } from 'react'
import { api_get_chat_sessions, type AiChatSessionRecord } from '../api/ai'

export const format_relative_time = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '최근'
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (diffSeconds < 60) return '방금'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export const get_session_title = (session: AiChatSessionRecord) =>
  session.questionText || session.title || `문제 ${session.questionId ?? session.sessionId} AI 질문`

export function useLearnAiHistory() {
  const [sessions, setSessions] = useState<AiChatSessionRecord[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api_get_chat_sessions('question')
        if (!alive) return
        setSessions(data)
        setActiveSessionId(data[0]?.sessionId ?? null)
      } catch {
        if (alive) setError('학습 AI 질문 기록을 불러오지 못했습니다.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  const activeSession = useMemo(
    () => sessions.find((s) => s.sessionId === activeSessionId) ?? sessions[0] ?? null,
    [activeSessionId, sessions],
  )

  return { sessions, activeSessionId, setActiveSessionId, activeSession, loading, error }
}
