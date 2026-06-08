import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { api_get_questions } from '../api/learning'
import {
  api_get_chat_sessions,
  api_stream_chat_session,
  api_stream_general_chat,
  api_stream_question_chat,
  type AiChatMessageRecord,
  type AiChatSessionRecord,
  type AiStreamEvent,
} from '../api/ai'

type MessageRole = 'assistant' | 'user'

interface ChatMessage {
  id: number
  role: MessageRole
  content: string
}

interface ChatHistory {
  id: number
  sessionId: number | null
  title: string
  preview: string
  time: string
  messages: ChatMessage[]
}

const WELCOME_MARKDOWN = `# 무엇을 분석해볼까요?
종목명, 티커, 투자 아이디어를 입력하면 재무 지표와 시장 흐름을 함께 정리해드릴게요.

- 종목의 핵심 리스크
- 실적과 밸류에이션 흐름
- 매수/매도 판단에 필요한 체크포인트`

const INITIAL_HISTORY: ChatHistory[] = [
  {
    id: 1,
    sessionId: null,
    title: '새 AI 분석',
    preview: '질문을 입력해 분석을 시작하세요',
    time: '방금',
    messages: [{ id: 1, role: 'assistant', content: WELCOME_MARKDOWN }],
  },
]

const PROMPT_SUGGESTIONS = [
  '삼성전자 지금 매수해도 될까?',
  'PER과 PBR 기준으로 저평가 종목 찾아줘',
  '오늘 시장에서 반도체 섹터 흐름 요약해줘',
  '내 관심종목 리스크를 체크해줘',
]

const get_question_id = (value: unknown) => {
  if (!value || typeof value !== 'object') return 0
  const obj = value as Record<string, unknown>
  return Number(obj.question_id ?? obj.questionId ?? 0)
}

const get_questions_array = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  const obj = value as Record<string, unknown>
  const nested = obj.data ?? obj.items ?? obj.content ?? obj.questions

  return Array.isArray(nested) ? nested : []
}

const format_relative_time = (value: string) => {
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

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

const map_chat_message = (message: AiChatMessageRecord): ChatMessage => ({
  id: message.messageId,
  role: message.senderType === 'USER' ? 'user' : 'assistant',
  content: message.messageText,
})

const map_chat_session = (session: AiChatSessionRecord): ChatHistory => {
  const messages = session.messages.map(map_chat_message)

  return {
    id: session.sessionId,
    sessionId: session.sessionId,
    title: session.title || 'AI 대화',
    preview: session.preview || '대화 기록이 없습니다.',
    time: format_relative_time(session.updatedAt || session.createdAt),
    messages: messages.length > 0
      ? messages
      : [{ id: session.sessionId * -1, role: 'assistant', content: WELCOME_MARKDOWN }],
  }
}

function render_inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function MarkdownMessage({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.split('\n')
    const rendered: ReactNode[] = []
    let listItems: string[] = []
    let orderedItems: string[] = []
    let codeLines: string[] = []
    let inCode = false

    const flush_list = () => {
      if (listItems.length > 0) {
        rendered.push(
          <ul key={`ul-${rendered.length}`}>
            {listItems.map((item) => <li key={item}>{render_inline(item)}</li>)}
          </ul>,
        )
        listItems = []
      }

      if (orderedItems.length > 0) {
        rendered.push(
          <ol key={`ol-${rendered.length}`}>
            {orderedItems.map((item) => <li key={item}>{render_inline(item.replace(/^\d+\.\s*/, ''))}</li>)}
          </ol>,
        )
        orderedItems = []
      }
    }

    lines.forEach((line) => {
      if (line.startsWith('```')) {
        if (inCode) {
          rendered.push(<pre key={`code-${rendered.length}`}><code>{codeLines.join('\n')}</code></pre>)
          codeLines = []
        } else {
          flush_list()
        }
        inCode = !inCode
        return
      }

      if (inCode) {
        codeLines.push(line)
        return
      }

      if (!line.trim()) {
        flush_list()
        return
      }

      if (line.startsWith('### ')) {
        flush_list()
        rendered.push(<h3 key={`h3-${rendered.length}`}>{render_inline(line.slice(4))}</h3>)
        return
      }

      if (line.startsWith('## ')) {
        flush_list()
        rendered.push(<h2 key={`h2-${rendered.length}`}>{render_inline(line.slice(3))}</h2>)
        return
      }

      if (line.startsWith('# ')) {
        flush_list()
        rendered.push(<h1 key={`h1-${rendered.length}`}>{render_inline(line.slice(2))}</h1>)
        return
      }

      if (line.startsWith('- ')) {
        listItems.push(line.slice(2))
        return
      }

      if (/^\d+\.\s/.test(line)) {
        orderedItems.push(line)
        return
      }

      flush_list()
      rendered.push(<p key={`p-${rendered.length}`}>{render_inline(line)}</p>)
    })

    flush_list()

    if (codeLines.length > 0) {
      rendered.push(<pre key={`code-${rendered.length}`}><code>{codeLines.join('\n')}</code></pre>)
    }

    return rendered
  }, [content])

  return <div className="markdown-message">{blocks}</div>
}

export default function AIPage() {
  const [histories, setHistories] = useState(INITIAL_HISTORY)
  const [activeChatId, setActiveChatId] = useState(INITIAL_HISTORY[0].id)
  const [inputText, setInputText] = useState('')
  const [seedQuestionId, setSeedQuestionId] = useState<number | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [statusText, setStatusText] = useState('AI 서버 연결 준비 중')
  const nextChatIdRef = useRef(2)
  const nextMessageIdRef = useRef(2)

  const activeChat = histories.find((chat) => chat.id === activeChatId) ?? histories[0]

  useEffect(() => {
    let alive = true

    const load_chat_data = async () => {
      const [sessionsResult, questionsResult] = await Promise.allSettled([
        api_get_chat_sessions(),
        api_get_questions(),
      ])

      if (!alive) return

      if (questionsResult.status === 'fulfilled') {
        const firstQuestionId = get_questions_array(questionsResult.value.data)
          .map(get_question_id)
          .find((id) => id > 0) ?? null
        setSeedQuestionId(firstQuestionId)
      }

      if (sessionsResult.status === 'fulfilled') {
        const loadedHistories = sessionsResult.value.data.map(map_chat_session)
        if (loadedHistories.length > 0) {
          const maxChatId = Math.max(...loadedHistories.map((chat) => chat.id))
          const maxMessageId = Math.max(
            1,
            ...loadedHistories.flatMap((chat) => chat.messages.map((message) => message.id)),
          )

          setHistories(loadedHistories)
          setActiveChatId(loadedHistories[0].id)
          nextChatIdRef.current = maxChatId + 1
          nextMessageIdRef.current = maxMessageId + 1
        }

        setStatusText('AI 서버 연결됨')
        return
      }

      setStatusText('AI 대화 기록 확인 필요')
    }

    void load_chat_data()

    return () => {
      alive = false
    }
  }, [])

  const start_new_chat = () => {
    const nextId = nextChatIdRef.current
    nextChatIdRef.current += 1
    const nextChat: ChatHistory = {
      id: nextId,
      sessionId: null,
      title: '새 AI 분석',
      preview: '질문을 입력해 분석을 시작하세요',
      time: '방금',
      messages: [{ id: nextMessageIdRef.current, role: 'assistant', content: WELCOME_MARKDOWN }],
    }
    nextMessageIdRef.current += 1
    setHistories((prev) => [nextChat, ...prev])
    setActiveChatId(nextId)
    setInputText('')
  }

  const patch_chat = (chatId: number, updater: (chat: ChatHistory) => ChatHistory) => {
    setHistories((prev) => prev.map((chat) => (
      chat.id === chatId ? updater(chat) : chat
    )))
  }

  const send_message = async (text: string) => {
    const value = text.trim()
    if (!value || isSending) return

    const targetChat = activeChat
    const targetChatId = targetChat.id
    const userMessage: ChatMessage = { id: nextMessageIdRef.current, role: 'user', content: value }
    nextMessageIdRef.current += 1
    const assistantId = nextMessageIdRef.current
    const assistantMessage: ChatMessage = { id: assistantId, role: 'assistant', content: '' }
    nextMessageIdRef.current += 1

    patch_chat(targetChatId, (chat) => ({
      ...chat,
      title: chat.title === '새 AI 분석' ? value.slice(0, 18) : chat.title,
      preview: value,
      time: '방금',
      messages: [...chat.messages, userMessage, assistantMessage],
    }))
    setInputText('')
    setIsSending(true)
    setStatusText('답변 생성 중')

    const onEvent = (event: AiStreamEvent) => {
      if (event.type === 'session' || event.type === 'done') {
        patch_chat(targetChatId, (chat) => ({ ...chat, sessionId: event.sessionId }))
      }

      if (event.type !== 'token') return

      patch_chat(targetChatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((message) => (
          message.id === assistantId
            ? { ...message, content: `${message.content}${event.content}` }
            : message
        )),
      }))
    }

    try {
      if (targetChat.sessionId) {
        await api_stream_chat_session(targetChat.sessionId, value, onEvent)
      } else if (!seedQuestionId) {
        await api_stream_general_chat(value, onEvent)
      } else {
        try {
          await api_stream_general_chat(value, onEvent)
        } catch {
          await api_stream_question_chat(seedQuestionId, value, onEvent)
        }
      }
      setStatusText('AI 서버 연결됨')
    } catch (err) {
      const reason = err instanceof Error && err.message ? `\n\n${err.message}` : ''
      patch_chat(targetChatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((message) => (
          message.id === assistantId
            ? { ...message, content: `AI 답변을 받아오지 못했습니다. 백엔드 AI 서버와 인증 상태를 확인해주세요.${reason}` }
            : message
        )),
      }))
      setStatusText('AI 응답 실패')
    } finally {
      setIsSending(false)
    }
  }

  const handle_key_down = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send_message(inputText)
    }
  }

  return (
    <AppLayout topbarPlaceholder="AI 분석 대화 검색">
      <section className="ai-chat-shell">
        <aside className="ai-history-nav" aria-label="AI 채팅 기록">
          <button className="ai-new-chat" onClick={start_new_chat}>
            <i className="bi bi-plus-lg" />
            새 대화
          </button>

          <div className="ai-history-label">이전 대화</div>
          <div className="ai-history-list">
            {histories.map((chat) => (
              <button
                key={chat.id}
                className={`ai-history-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <span className="ai-history-title">{chat.title}</span>
                <span className="ai-history-preview">{chat.preview}</span>
                <span className="ai-history-time">{chat.time}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="ai-chat-main">
          <header className="ai-chat-header">
            <div>
              <h1>AI 분석</h1>
              <p>종목, 시장, 포트폴리오 질문을 자유롭게 대화해보세요.</p>
            </div>
            <span className="ai-status">
              <i className="bi bi-stars" />
              {isSending ? '응답 생성 중' : statusText}
            </span>
          </header>

          <div className="ai-message-list">
            {activeChat.messages.map((message) => (
              <article key={message.id} className={`ai-message ${message.role}`}>
                {message.role === 'assistant' ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <div className="ai-user-bubble">{message.content}</div>
                )}
              </article>
            ))}
          </div>

          <div className="ai-suggestion-row">
            {PROMPT_SUGGESTIONS.map((prompt) => (
              <button key={prompt} onClick={() => void send_message(prompt)} disabled={isSending}>
                {prompt}
              </button>
            ))}
          </div>

          <footer className="ai-composer">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handle_key_down}
              placeholder="궁금한 종목이나 투자 아이디어를 입력하세요"
              rows={1}
            />
            <button onClick={() => void send_message(inputText)} aria-label="메시지 보내기" disabled={isSending}>
              <i className="bi bi-send-fill" />
            </button>
          </footer>
        </main>
      </section>
    </AppLayout>
  )
}
