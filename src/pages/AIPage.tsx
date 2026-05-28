import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import AppLayout from '../components/layout/AppLayout'

type MessageRole = 'assistant' | 'user'

interface ChatMessage {
  id: number
  role: MessageRole
  content: string
}

interface ChatHistory {
  id: number
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

const SAMPLE_REPLY = (question: string) => `## ${question}

현재 입력하신 내용을 기준으로 분석 초안을 만들고 있습니다.

### 핵심 체크
- 최근 주가 움직임과 거래량을 먼저 확인하세요.
- 실적 전망, 업종 사이클, 밸류에이션을 함께 비교하는 편이 좋습니다.
- 단기 뉴스만으로 판단하기보다 손절 기준과 투자 기간을 먼저 정해두세요.

**다음 질문 예시:** "이 종목의 상승 여력과 하락 리스크를 비교해줘"`

const INITIAL_HISTORY: ChatHistory[] = [
  {
    id: 1,
    title: '삼성전자 장기 투자',
    preview: '메모리 업황과 PER 구간 분석',
    time: '오늘',
    messages: [
      { id: 1, role: 'assistant', content: WELCOME_MARKDOWN },
      { id: 2, role: 'user', content: '삼성전자 장기 투자 관점으로 봐줘' },
      {
        id: 3,
        role: 'assistant',
        content: `## 삼성전자 장기 투자 관점

장기 관점에서는 메모리 반도체 사이클, 파운드리 경쟁력, 주주환원 정책을 같이 봐야 합니다.

- **강점:** 현금창출력과 글로벌 메모리 점유율
- **확인할 부분:** HBM 경쟁력, 설비투자 부담, 환율 영향
- **전략:** 실적 추정치가 올라오는 구간에서는 분할 접근이 유리합니다.`,
      },
    ],
  },
  {
    id: 2,
    title: 'SK하이닉스 리스크',
    preview: 'HBM 기대감과 밸류에이션 부담',
    time: '어제',
    messages: [
      { id: 1, role: 'assistant', content: WELCOME_MARKDOWN },
      { id: 2, role: 'user', content: 'SK하이닉스 지금 비싼지 알려줘' },
      {
        id: 3,
        role: 'assistant',
        content: `## SK하이닉스 밸류에이션 점검

HBM 성장 기대가 주가에 선반영된 구간에서는 실적 상향 속도가 중요합니다.

1. 서버 AI 수요 지속성
2. 경쟁사 증설 속도
3. 영업이익률 개선 폭`,
      },
    ],
  },
  {
    id: 3,
    title: '배당주 포트폴리오',
    preview: '금리 하락기 배당 전략',
    time: '3일 전',
    messages: [
      { id: 1, role: 'assistant', content: WELCOME_MARKDOWN },
      { id: 2, role: 'user', content: '배당주 포트폴리오 짜는 기준 알려줘' },
      {
        id: 3,
        role: 'assistant',
        content: `## 배당주 포트폴리오 기준

- 배당수익률보다 **배당 지속성**을 우선하세요.
- 이익 변동성이 큰 업종은 비중을 제한하는 편이 좋습니다.
- 현금흐름과 부채비율을 함께 확인하세요.`,
      },
    ],
  },
]

const PROMPT_SUGGESTIONS = [
  '삼성전자 지금 매수해도 될까?',
  'PER과 PBR 기준으로 저평가 종목 찾아줘',
  '오늘 시장에서 반도체 섹터 흐름 요약해줘',
  '내 관심종목 리스크를 체크해줘',
]

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
  const nextChatIdRef = useRef(4)
  const nextMessageIdRef = useRef(10)

  const activeChat = histories.find((chat) => chat.id === activeChatId) ?? histories[0]

  const start_new_chat = () => {
    const nextId = nextChatIdRef.current
    nextChatIdRef.current += 1
    const nextChat: ChatHistory = {
      id: nextId,
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

  const send_message = (text: string) => {
    const value = text.trim()
    if (!value) return

    const userMessage: ChatMessage = { id: nextMessageIdRef.current, role: 'user', content: value }
    nextMessageIdRef.current += 1
    const assistantMessage: ChatMessage = {
      id: nextMessageIdRef.current,
      role: 'assistant',
      content: SAMPLE_REPLY(value),
    }
    nextMessageIdRef.current += 1

    setHistories((prev) => prev.map((chat) => (
      chat.id === activeChatId
        ? {
          ...chat,
          title: chat.title === '새 AI 분석' ? value.slice(0, 18) : chat.title,
          preview: value,
          time: '방금',
          messages: [...chat.messages, userMessage, assistantMessage],
        }
        : chat
    )))
    setInputText('')
  }

  const handle_key_down = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send_message(inputText)
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
              Markdown 답변
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
              <button key={prompt} onClick={() => send_message(prompt)}>
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
            <button onClick={() => send_message(inputText)} aria-label="메시지 보내기">
              <i className="bi bi-send-fill" />
            </button>
          </footer>
        </main>
      </section>
    </AppLayout>
  )
}
