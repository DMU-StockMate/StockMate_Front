import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Chip, { ChipRow } from '../components/common/Chip'

const POPULAR = ['삼성전자', 'SK하이닉스', '카카오', '네이버', '현대차', 'LG에너지솔루션', '셀트리온']
const RECENT = ['카카오 · 3시간 전', 'SK하이닉스 · 어제', '현대차 · 2일 전']

const RECOMMENDED = [
  { logo: '삼', name: '삼성전자', code: '005930', price: '72,400', change: '+1.85%', up: true, tag: '변동성 낮음' },
  { logo: 'KT', name: 'KT&G', code: '033780', price: '94,100', change: '-0.42%', up: false, tag: '고배당' },
  { logo: '신', name: '신한지주', code: '055550', price: '48,200', change: '+0.83%', up: true, tag: '대형주' },
]

const ISSUES = [
  { label: '시황', text: '외국인 순매수 5거래일째…' },
  { label: '지수', text: '코스피 종가 2,720선 회복' },
  { label: '환율', text: '원/달러 1,360원대 진입' },
]

export default function AIPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeStock, setActiveStock] = useState('')

  const handle_search = () => {
    if (query.trim()) navigate(`/ai/${encodeURIComponent(query.trim())}`)
  }

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handle_search()
  }

  const handle_chip_click = (name: string) => {
    setActiveStock(name)
    navigate(`/ai/${encodeURIComponent(name)}`)
  }

  return (
    <AppLayout topbarPlaceholder="종목명, 종목코드 검색">
      <div className="page-title">
        <div>
          <h1>AI 분석</h1>
          <div className="page-sub">종목을 검색하고 AI에게 무엇이든 물어보세요</div>
        </div>
      </div>

      <Card style={{ marginBottom: 20, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="bi bi-search" style={{ fontSize: 16, color: 'var(--primary)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handle_key_down}
            placeholder="종목명, 종목코드를 입력하세요 (예: 삼성전자, 005930)"
            style={{ flex: 1, fontSize: 15, border: 'none', outline: 'none', color: 'var(--t1)', background: 'transparent' }}
          />
          <button className="btn btn-sm" onClick={handle_search}>검색</button>
        </div>
      </Card>

      <div style={{ marginBottom: 24 }}>
        <div className="section-title">인기 종목</div>
        <ChipRow>
          {POPULAR.map((name) => (
            <Chip key={name} active={activeStock === name} onClick={() => handle_chip_click(name)}>
              {name}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div>
          <div className="section-title">내 등급에 맞는 추천</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {RECOMMENDED.map((s) => (
              <Card key={s.code} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ai/${s.code}`)}>
                <div className="stock-cell" style={{ marginBottom: 14 }}>
                  <div className="logo-sm">{s.logo}</div>
                  <div>
                    <div className="strong">{s.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{s.code}</div>
                  </div>
                </div>
                <div className="row">
                  <span className="strong" style={{ fontSize: 18 }}>{s.price}</span>
                  <span className={s.up ? 'price-up' : 'price-down'}>{s.change}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="pill">{s.tag}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title">오늘의 이슈</div>
          <Card style={{ padding: 0 }}>
            {ISSUES.map((issue, i) => (
              <div
                key={issue.label}
                style={{ padding: '14px 18px', borderBottom: i < ISSUES.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="muted" style={{ fontSize: 11 }}>{issue.label}</div>
                <div className="strong" style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>{issue.text}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div>
        <div className="section-title">최근 검색</div>
        <ChipRow>
          {RECENT.map((r) => (
            <Chip key={r} onClick={() => handle_chip_click(r.split(' · ')[0])}>{r}</Chip>
          ))}
        </ChipRow>
      </div>
    </AppLayout>
  )
}
