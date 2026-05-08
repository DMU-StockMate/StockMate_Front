import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Pill from '../components/common/Pill'

interface Holding {
  logo: string
  name: string
  code: string
  qty: number
  avgPrice: string
  curPrice: string
  pnl: string
  pnlPct: string
  up: boolean
}

interface RecentTrade {
  type: 'up' | 'down'
  label: string
  name: string
  qty: number
  date: string
  execPrice: string
  returnPct: string
  up: boolean
}

const HOLDINGS: Holding[] = [
  { logo: '삼', name: '삼성전자', code: '005930', qty: 3, avgPrice: '70,200원', curPrice: '72,400원', pnl: '+6,600원', pnlPct: '+3.13%', up: true },
  { logo: '카', name: '카카오', code: '035720', qty: 2, avgPrice: '58,000원', curPrice: '55,000원', pnl: '-6,000원', pnlPct: '-5.17%', up: false },
  { logo: 'SK', name: 'SK하이닉스', code: '000660', qty: 1, avgPrice: '185,500원', curPrice: '192,300원', pnl: '+6,800원', pnlPct: '+3.66%', up: true },
]

const RECENT_TRADES: RecentTrade[] = [
  { type: 'up', label: '매수', name: '삼성전자', qty: 1, date: '04.15', execPrice: '70,100원', returnPct: '+3.2%', up: true },
  { type: 'down', label: '매도', name: 'SK하이닉스', qty: 1, date: '04.05', execPrice: '178,200원', returnPct: '+8.0%', up: true },
  { type: 'up', label: '매수', name: '카카오', qty: 2, date: '04.10', execPrice: '58,000원', returnPct: '-5.2%', up: false },
  { type: 'up', label: '매수', name: 'SK하이닉스', qty: 1, date: '03.28', execPrice: '185,500원', returnPct: '+3.7%', up: true },
]

interface ModalState {
  open: boolean
  mode: 'buy' | 'sell'
  stock?: Holding
}

export default function TradePage() {
  const navigate = useNavigate()
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'buy' })
  const [qty, setQty] = useState(2)

  const handle_open_modal = (mode: 'buy' | 'sell', stock?: Holding) => {
    setModal({ open: true, mode, stock })
    setQty(1)
  }

  const handle_close_modal = () => setModal({ open: false, mode: 'buy' })

  const unitPrice = 72400
  const totalPrice = (unitPrice * qty).toLocaleString()
  const remaining = (5212400 - unitPrice * qty).toLocaleString()

  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div className="page-title">
        <div>
          <h1>모의투자</h1>
          <div className="page-sub">1주 단위로 안전하게 실전 감각을 익혀보세요</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => navigate('/trade/history')}>📋 투자 내역</Button>
          <Button variant="outline">🏆 랭킹전</Button>
          <Button onClick={() => navigate('/trade/stocks')}>+ 종목 둘러보기</Button>
        </div>
      </div>

      {/* 자산 hero + 빠른 액션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card variant="hero" className="card-lg" style={{ position: 'relative' }}>
          <div className="row">
            <div>
              <div className="label" style={{ opacity: 0.85 }}>평가 자산</div>
              <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>12,540,000원</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>평가손익 <b>+540,000원 (+4.50%)</b></div>
              <div style={{ opacity: 0.85, fontSize: 12, marginTop: 4 }}>예수금 5,212,400원 · 보유 평가 1,254,000원</div>
            </div>
            <div style={{ width: 240, height: 80 }}>
              <svg viewBox="0 0 240 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <polyline fill="rgba(255,255,255,0.18)" stroke="none" points="0,60 25,50 50,62 75,40 100,45 125,30 150,35 175,18 200,22 225,8 240,5 240,80 0,80" />
                <polyline fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" points="0,60 25,50 50,62 75,40 100,45 125,30 150,35 175,18 200,22 225,8 240,5" />
              </svg>
            </div>
          </div>
          <div className="row" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>오늘 거래 2건 · 자산 변화 +124,500원</span>
            <span
              style={{ fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate('/trade/history')}
            >
              오늘 내역 보기 →
            </span>
          </div>
        </Card>

        <div>
          <div className="section-title" style={{ marginBottom: 12, fontSize: 14 }}>빠른 액션</div>
          <div className="action-grid">
            <div className="action-card up" onClick={() => handle_open_modal('buy')}>
              <div className="ac-ico">↗</div>
              <div className="ac-name">매수</div>
              <div className="ac-desc">새 종목 매수</div>
            </div>
            <div className="action-card down" onClick={() => handle_open_modal('sell')}>
              <div className="ac-ico">↘</div>
              <div className="ac-name">매도</div>
              <div className="ac-desc">보유 종목 매도</div>
            </div>
            <div className="action-card" onClick={() => navigate('/trade/stocks')}>
              <div className="ac-ico">🔍</div>
              <div className="ac-name">종목 둘러보기</div>
              <div className="ac-desc">전체 종목 탐색</div>
            </div>
            <div className="action-card" onClick={() => navigate('/trade/history')}>
              <div className="ac-ico">📋</div>
              <div className="ac-name">투자 내역</div>
              <div className="ac-desc">기록 + AI 피드백</div>
            </div>
          </div>
        </div>
      </div>

      {/* 랭킹전 배너 */}
      <div className="ranking-banner" style={{ marginBottom: 20 }}>
        <div className="trophy-ico">🏆</div>
        <div style={{ flex: 1 }}>
          <div className="strong" style={{ fontSize: 14 }}>이번 주 랭킹전 진행 중 — 현재 순위 27위 / 312명</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>상위 10% 진입 시 추가 자금 +10,000원 · 5월 6일 마감</div>
        </div>
        <button className="btn btn-sm" style={{ background: '#fff', color: '#92400E' }}>참여하기 →</button>
      </div>

      {/* 보유 종목 + 최근 거래 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <Card>
          <div className="row" style={{ marginBottom: 14 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 0 }}>보유 종목 {HOLDINGS.length}개</div>
              <div className="muted" style={{ fontSize: 12 }}>총 평가금액 1,254,000원</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/trade/stocks')}>+ 종목 추가</Button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>종목</th><th>보유</th><th>평균가</th><th>현재가</th><th>평가손익</th><th>액션</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS.map((h) => (
                <tr key={h.code}>
                  <td>
                    <div className="stock-cell">
                      <div className="logo-sm">{h.logo}</div>
                      <div>
                        <div className="strong">{h.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{h.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>{h.qty}주</td>
                  <td>{h.avgPrice}</td>
                  <td className="strong">{h.curPrice}</td>
                  <td>
                    <div className={h.up ? 'price-up' : 'price-down'}>{h.pnl}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{h.pnlPct}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-up" onClick={() => handle_open_modal('buy', h)}>매수</button>
                      <button className="btn btn-sm btn-outline" onClick={() => handle_open_modal('sell', h)}>매도</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>최근 거래</div>
            <span
              className="muted"
              style={{ fontSize: 12, cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }}
              onClick={() => navigate('/trade/history')}
            >
              전체 내역 →
            </span>
          </div>
          {RECENT_TRADES.map((t, i) => (
            <div key={i} className="activity-row">
              <div className="left">
                <Pill variant={t.type}>{t.label}</Pill>
                <div>
                  <div className="strong" style={{ fontSize: 13 }}>{t.name} {t.qty}주</div>
                  <div className="muted" style={{ fontSize: 11 }}>{t.date} · {t.execPrice}</div>
                </div>
              </div>
              <div className={t.up ? 'price-up' : 'price-down'} style={{ fontSize: 13 }}>{t.returnPct}</div>
            </div>
          ))}
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 14 }}
            onClick={() => navigate('/trade/history')}
          >
            📋 투자 내역 + AI 피드백 보기
          </button>
        </Card>
      </div>

      {/* 매수/매도 모달 */}
      {modal.open && (
        <div className="modal-backdrop" onClick={handle_close_modal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ marginBottom: 18 }}>
              <h2>주문하기</h2>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--t2)' }}
                onClick={handle_close_modal}
              >×</button>
            </div>

            <div className="trade-tab" style={{ marginBottom: 18 }}>
              <button
                className={modal.mode === 'buy' ? 'active-tab' : 'inactive-tab'}
                onClick={() => setModal((m) => ({ ...m, mode: 'buy' }))}
              >
                매수
              </button>
              <button
                className={modal.mode === 'sell' ? 'active-tab' : 'inactive-tab'}
                style={{ ...(modal.mode === 'sell' ? { background: 'var(--down)', color: '#fff' } : {}) }}
                onClick={() => setModal((m) => ({ ...m, mode: 'sell' }))}
              >
                매도
              </button>
            </div>

            <div
              className="card"
              style={{ background: 'var(--primary-subtle)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}
            >
              <div className="row">
                <div className="stock-cell">
                  <div className="logo-sm">삼</div>
                  <div>
                    <div className="strong">삼성전자</div>
                    <div className="muted" style={{ fontSize: 12 }}>005930</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="strong" style={{ fontSize: 16 }}>72,400원</div>
                  <div className="price-up" style={{ fontSize: 12 }}>+1.85%</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div className="label" style={{ marginBottom: 10 }}>수량 (1주 단위)</div>
              <div className="stepper">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <div className="qty">{qty}</div>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            </div>

            <div
              className="card"
              style={{ background: 'var(--bg)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}
            >
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">예상 체결금액</span>
                <span className="strong">{totalPrice}원</span>
              </div>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">보유 가용 자금</span>
                <span>5,212,400원</span>
              </div>
              <div className="row" style={{ fontSize: 13 }}>
                <span className="muted">{modal.mode === 'buy' ? '매수 후 잔여' : '매도 후 예수금'}</span>
                <span className="strong" style={{ color: 'var(--primary)' }}>{remaining}원</span>
              </div>
            </div>

            <button
              className={`btn btn-lg ${modal.mode === 'buy' ? 'btn-up' : 'btn-down'}`}
              style={{ width: '100%' }}
              onClick={handle_close_modal}
            >
              {modal.mode === 'buy' ? '매수하기' : '매도하기'}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
