import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Chip, { ChipRow } from '../components/common/Chip'

interface Stock {
  logo: string
  name: string
  code: string
  market: string
  sector: string
  price: string
  change: string
  changePct: string
  volume: string
  cap: string
  up: boolean
}

const ALL_STOCKS: Stock[] = [
  { logo: '삼', name: '삼성전자', code: '005930', market: 'KOSPI', sector: '반도체', price: '72,400원', change: '+1,300', changePct: '+1.85%', volume: '12.4M', cap: '432조', up: true },
  { logo: 'SK', name: 'SK하이닉스', code: '000660', market: 'KOSPI', sector: '반도체', price: '192,300원', change: '+3,800', changePct: '+2.01%', volume: '5.8M', cap: '140조', up: true },
  { logo: 'LG', name: 'LG에너지솔루션', code: '373220', market: 'KOSPI', sector: '2차전지', price: '412,500원', change: '-3,500', changePct: '-0.84%', volume: '2.1M', cap: '96조', up: false },
  { logo: '현', name: '현대차', code: '005380', market: 'KOSPI', sector: '자동차', price: '258,000원', change: '+4,500', changePct: '+1.78%', volume: '3.2M', cap: '54조', up: true },
  { logo: '카', name: '카카오', code: '035720', market: 'KOSPI', sector: '인터넷', price: '55,000원', change: '-2,800', changePct: '-4.84%', volume: '8.1M', cap: '23조', up: false },
  { logo: '네', name: 'NAVER', code: '035420', market: 'KOSPI', sector: '인터넷', price: '192,500원', change: '+1,500', changePct: '+0.79%', volume: '1.5M', cap: '31조', up: true },
  { logo: '셀', name: '셀트리온', code: '068270', market: 'KOSPI', sector: '바이오', price: '182,000원', change: '+2,500', changePct: '+1.39%', volume: '2.8M', cap: '27조', up: true },
  { logo: 'KT', name: 'KT&G', code: '033780', market: 'KOSPI', sector: '담배·소비재', price: '94,100원', change: '-400', changePct: '-0.42%', volume: '1.2M', cap: '13조', up: false },
]

const SEARCH_RESULTS = [
  { logo: '삼', name: '삼성전자', code: '005930', market: 'KOSPI', sector: '반도체', price: '72,400원', changePct: '+1.85%', up: true },
  { logo: '삼SDI', name: '삼성SDI', code: '006400', market: 'KOSPI', sector: '2차전지', price: '385,000원', changePct: '-1.28%', up: false },
  { logo: '삼바', name: '삼성바이오로직스', code: '207940', market: 'KOSPI', sector: '바이오', price: '812,000원', changePct: '+0.62%', up: true },
  { logo: '삼화', name: '삼성화재', code: '000810', market: 'KOSPI', sector: '보험', price: '324,500원', changePct: '+2.04%', up: true },
  { logo: '삼중', name: '삼성중공업', code: '010140', market: 'KOSPI', sector: '조선', price: '9,420원', changePct: '+3.41%', up: true },
  { logo: '삼증', name: '삼성증권', code: '016360', market: 'KOSPI', sector: '증권', price: '42,800원', changePct: '-0.46%', up: false },
]

const RELATED = [
  { sector: '반도체', type: '동일 업종', name: 'SK하이닉스', code: '000660', changePct: '+2.01%', up: true },
  { sector: '2차전지', type: '동일 업종', name: 'LG에너지솔루션', code: '373220', changePct: '-0.84%', up: false },
  { sector: '함께 본 종목', type: '', name: '현대차', code: '005380', changePct: '+1.78%', up: true },
]

type FilterType = '전체' | '코스피' | '코스닥' | '인기' | '급등' | '급락' | '거래량 상위' | '내 등급 추천'

export default function TradeStocksPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [filter, setFilter] = useState<FilterType>('전체')

  const isSearchMode = submitted && query.trim() !== ''

  const handle_search = () => {
    if (query.trim()) setSubmitted(true)
  }

  const handle_clear = () => {
    setQuery('')
    setSubmitted(false)
  }

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handle_search()
  }

  const searchKeyword = query.trim()

  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/trade')}>모의투자</span>
        <span className="bc-sep">›</span>
        {isSearchMode ? (
          <>
            <span className="bc-link" onClick={handle_clear}>전체 종목</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">검색 결과</span>
          </>
        ) : (
          <span className="bc-current">전체 종목 둘러보기</span>
        )}
      </div>

      {!isSearchMode ? (
        <>
          <div className="page-title">
            <div>
              <h1>전체 종목 둘러보기</h1>
              <div className="page-sub">2,847개 종목 중에서 검색하고 비교해보세요</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline">관심 종목만 보기 ★</Button>
              <Button>+ 매수 주문</Button>
            </div>
          </div>

          <Card style={{ marginBottom: 16, padding: '18px 20px' }}>
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
              <Button size="sm" onClick={handle_search}>검색</Button>
            </div>
          </Card>

          <div className="row" style={{ marginBottom: 16 }}>
            <ChipRow>
              {(['전체', '코스피', '코스닥', '인기', '급등', '급락', '거래량 상위', '내 등급 추천'] as FilterType[]).map((f) => (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
              ))}
            </ChipRow>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 12 }}>정렬:</span>
              <Chip active>시가총액 ↓</Chip>
            </div>
          </div>

          <Card style={{ padding: 0 }}>
            <table className="tbl" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--primary-subtle)' }}>
                  <th style={{ paddingLeft: 24 }}>종목</th>
                  <th>현재가</th>
                  <th>등락</th>
                  <th>등락률</th>
                  <th>거래량</th>
                  <th>시가총액</th>
                  <th style={{ paddingRight: 24 }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {ALL_STOCKS.map((s) => (
                  <tr key={s.code}>
                    <td style={{ paddingLeft: 24 }}>
                      <div className="stock-cell">
                        <div className="logo-sm">{s.logo}</div>
                        <div>
                          <div className="strong">{s.name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{s.code} · {s.market} · {s.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="strong">{s.price}</td>
                    <td className={s.up ? 'price-up' : 'price-down'}>{s.change}</td>
                    <td className={s.up ? 'price-up' : 'price-down'}>{s.changePct}</td>
                    <td>{s.volume}</td>
                    <td>{s.cap}</td>
                    <td style={{ paddingRight: 24 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-ghost">★</button>
                        <button className="btn btn-sm btn-up">매수</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)' }}>
              <span className="muted" style={{ fontSize: 12 }}>1 - 8 / 2,847 종목</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button size="sm" variant="outline">← 이전</Button>
                <Chip active>1</Chip>
                <Chip>2</Chip>
                <Chip>3</Chip>
                <Chip>…</Chip>
                <Button size="sm" variant="outline">다음 →</Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card
            style={{ marginBottom: 20, padding: '18px 20px', borderColor: 'var(--primary)', boxShadow: '0 0 0 4px rgba(109,41,217,0.10)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="bi bi-search" style={{ fontSize: 16, color: 'var(--primary)' }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handle_key_down}
                style={{ flex: 1, fontSize: 15, border: 'none', outline: 'none', color: 'var(--t1)', background: 'transparent' }}
              />
              <button className="btn btn-sm btn-outline" onClick={handle_clear}>✕</button>
              <Button size="sm" onClick={handle_search}>검색</Button>
            </div>
          </Card>

          <div className="row" style={{ marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20 }}>검색어 "<span className="hl">{searchKeyword}</span>" — 14개 종목</h1>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>최근 검색: 카카오 · SK하이닉스 · 현대차</div>
            </div>
            <ChipRow>
              <Chip active>전체 14</Chip>
              <Chip>코스피 12</Chip>
              <Chip>코스닥 2</Chip>
            </ChipRow>
          </div>

          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="dot-indicator" /> 일치하는 종목
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 24 }}>
            {SEARCH_RESULTS.map((s) => (
              <div
                key={s.code}
                className="card card-clickable"
                style={{ display: 'flex', alignItems: 'center', gap: 14 }}
              >
                <div className="logo-sm" style={{ width: 48, height: 48, fontSize: 13 }}>{s.logo}</div>
                <div style={{ flex: 1 }}>
                  <div className="strong" style={{ fontSize: 15 }}>
                    <span className="hl">{searchKeyword}</span>{s.name.replace(searchKeyword, '')}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{s.code} · {s.market} · {s.sector}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="strong" style={{ fontSize: 16 }}>{s.price}</div>
                  <div className={s.up ? 'price-up' : 'price-down'} style={{ fontSize: 12 }}>{s.changePct}</div>
                </div>
                <button className="btn btn-sm btn-up">매수</button>
              </div>
            ))}
          </div>

          <div className="section-title">관련 추천</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {RELATED.map((r) => (
              <div key={r.name} className="card card-clickable" style={{ padding: 16 }}>
                <div className="row">
                  <span className="pill">{r.sector}</span>
                  {r.type && <span className="muted" style={{ fontSize: 11 }}>{r.type}</span>}
                </div>
                <div className="strong" style={{ marginTop: 8, fontSize: 14 }}>{r.name}</div>
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="muted" style={{ fontSize: 12 }}>{r.code}</span>
                  <span className={r.up ? 'price-up' : 'price-down'} style={{ fontSize: 12 }}>{r.changePct}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  )
}
