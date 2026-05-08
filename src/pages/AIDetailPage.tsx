import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Chip, { ChipRow } from '../components/common/Chip'

interface ChatMessage {
  role: 'ai' | 'me'
  text: string
}

const SUGGESTED_QUESTIONS = ['이 종목의 위험요소는?', '비슷한 종목 알려줘', 'PER 14배는 비싼 편인가?']

const INITIAL_CHAT: ChatMessage[] = [
  { role: 'ai', text: '안녕하세요. 삼성전자에 대해 무엇이 궁금하신가요?' },
]

const TIME_TABS = ['1D', '1W', '1M', '3M', '1Y']

const METRICS = [
  { lbl: '시가총액', val: '432조원' },
  { lbl: 'PER', val: '14.2배' },
  { lbl: '거래량', val: '12.4M' },
]

export default function AIDetailPage() {
  const { code = '005930' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('1D')
  const [chat, setChat] = useState<ChatMessage[]>(INITIAL_CHAT)
  const [inputText, setInputText] = useState('')

  const stockName = code === '005930' || code === '삼성전자' ? '삼성전자' : decodeURIComponent(code)

  const handle_send = () => {
    const text = inputText.trim()
    if (!text) return
    const userMsg: ChatMessage = { role: 'me', text }
    const aiReply: ChatMessage = {
      role: 'ai',
      text: `"${text}"에 대한 분석입니다. 해당 종목의 최신 데이터를 기반으로 분석 중입니다.`,
    }
    setChat((prev) => [...prev, userMsg, aiReply])
    setInputText('')
  }

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handle_send()
  }

  const handle_suggest = (q: string) => {
    const userMsg: ChatMessage = { role: 'me', text: q }
    const replies: Record<string, string> = {
      '이 종목의 위험요소는?': '단기 환율 변동, 메모리 업황 둔화, 자사주 매입 종료가 주요 리스크입니다. 매출의 60%가 해외이며, 메모리 사이클 영향도가 큽니다.',
      '비슷한 종목 알려줘': 'SK하이닉스(000660), 마이크론(MU), TSMC(TSM) 등 반도체 섹터 기업들이 유사한 특성을 보입니다.',
      'PER 14배는 비싼 편인가?': '동종업계 평균 PER 약 12배 대비 소폭 높은 수준입니다. 성장 기대치를 고려하면 합리적인 밸류에이션으로 볼 수 있습니다.',
    }
    const aiReply: ChatMessage = { role: 'ai', text: replies[q] ?? `"${q}"에 대해 분석 중입니다.` }
    setChat((prev) => [...prev, userMsg, aiReply])
  }

  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div className="row" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/ai')}
            style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ‹
          </button>
          <div className="logo-sm" style={{ width: 48, height: 48, fontSize: 16 }}>삼</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{stockName}</div>
            <div className="muted" style={{ fontSize: 13 }}>005930 · KOSPI · 반도체</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline">★ 즐겨찾기</Button>
          <Button variant="up">매수</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* 왼쪽 - 차트 + 지표 + AI 요약 */}
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div className="row">
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>72,400원</div>
                <div className="price-up" style={{ fontSize: 14, marginTop: 4 }}>▲ 1,300 (+1.85%)</div>
              </div>
              <ChipRow>
                {TIME_TABS.map((t) => (
                  <Chip key={t} active={activeTab === t} onClick={() => setActiveTab(t)}>{t}</Chip>
                ))}
              </ChipRow>
            </div>
            <div style={{ height: 220, marginTop: 16 }}>
              <svg viewBox="0 0 700 220" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline fill="url(#chartGrad)" stroke="none" points="0,150 50,140 100,160 150,120 200,130 250,100 300,90 350,110 400,80 450,90 500,60 550,70 600,40 650,50 700,30 700,220 0,220" />
                <polyline fill="none" stroke="#EF4444" strokeWidth="2.5" points="0,150 50,140 100,160 150,120 200,130 250,100 300,90 350,110 400,80 450,90 500,60 550,70 600,40 650,50 700,30" />
              </svg>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            {METRICS.map((m) => (
              <div key={m.lbl} className="metric">
                <div className="lbl">{m.lbl}</div>
                <div className="val">{m.val}</div>
              </div>
            ))}
          </div>

          <Card>
            <div className="row" style={{ marginBottom: 12 }}>
              <span className="pill">AI 요약</span>
              <span className="muted" style={{ fontSize: 12 }}>방금 업데이트</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--t1)' }}>
              메모리 가격 반등 기대감과 외국인 순매수 유입으로 단기 강세. PER 14배는 동종업계 평균보다 약간 높은 수준이므로 분할 매수 권장.
            </div>
          </Card>
        </div>

        {/* 오른쪽 - AI 채팅 */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, height: 680 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>AI</div>
                <div>
                  <div className="strong">AI 채팅</div>
                  <div className="muted" style={{ fontSize: 11 }}>Claude · {stockName} 분석</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="muted" style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>추천 질문</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <div key={q} className="qchip" onClick={() => handle_suggest(q)}>{q}</div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
            <div className="chat-list">
              {chat.map((msg, i) => (
                <div key={i} className={`bubble ${msg.role}`}>{msg.text}</div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handle_key_down}
              placeholder="무엇이든 물어보세요"
              style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
            />
            <button className="btn" style={{ width: 44, padding: 0 }} onClick={handle_send}>→</button>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
