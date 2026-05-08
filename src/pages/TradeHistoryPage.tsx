import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Chip, { ChipRow } from '../components/common/Chip'
import Pill from '../components/common/Pill'

interface TradeRecord {
  date: string
  type: 'up' | 'down'
  typeLabel: string
  logo: string
  name: string
  qty: number
  execPrice: string
  returnPct: string
  returnUp: boolean
  returnLabel: string
  aiBlocks: { tag: string; text: string }[]
  collapsed?: boolean
}

const TRADES: TradeRecord[] = [
  {
    date: '2026.04.15 · 14:32',
    type: 'up', typeLabel: '매수',
    logo: '삼', name: '삼성전자', qty: 1, execPrice: '70,100원',
    returnPct: '+3.2%', returnUp: true, returnLabel: '현재 평가',
    aiBlocks: [
      { tag: '이유', text: '외국인 순매수 유입과 메모리 가격 반등 기대감으로 단기 강세 전환.' },
      { tag: '평가', text: '단기 흐름을 잘 잡으셨습니다. 다만 한 종목 비중이 65%로 높은 편이니 분산을 고려해보세요.' },
    ],
  },
  {
    date: '2026.04.10 · 10:15',
    type: 'up', typeLabel: '매수',
    logo: '카', name: '카카오', qty: 2, execPrice: '58,000원',
    returnPct: '-5.2%', returnUp: false, returnLabel: '현재 평가',
    aiBlocks: [
      { tag: '이유', text: '광고 매출 둔화와 컨센서스 하회로 단기 약세.' },
      { tag: '참고', text: '다음엔 분기 실적 발표일을 확인 후 진입을 고려해보세요.' },
    ],
  },
  {
    date: '2026.04.05 · 09:48',
    type: 'down', typeLabel: '매도',
    logo: 'SK', name: 'SK하이닉스', qty: 1, execPrice: '178,200원',
    returnPct: '+8.0%', returnUp: true, returnLabel: '실현 수익',
    aiBlocks: [],
    collapsed: true,
  },
]

type PeriodType = '1주' | '1개월' | '3개월' | '전체'

export default function TradeHistoryPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<PeriodType>('1개월')
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0, 1]))

  const handle_toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/trade')}>모의투자</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">투자 내역</span>
      </div>

      <div className="page-title">
        <div>
          <h1>투자 내역</h1>
          <div className="page-sub">매매 기록과 AI 피드백을 확인하세요</div>
        </div>
        <Button variant="outline">CSV 내보내기</Button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <ChipRow>
          {(['1주', '1개월', '3개월', '전체'] as PeriodType[]).map((p) => (
            <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>{p}</Chip>
          ))}
        </ChipRow>
      </div>

      {TRADES.map((trade, idx) => {
        const isExpanded = expanded.has(idx)
        return (
          <div key={idx}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{trade.date}</div>
            <Card
              style={{ marginBottom: 16, cursor: trade.aiBlocks.length === 0 ? 'pointer' : undefined }}
              onClick={trade.aiBlocks.length === 0 ? () => handle_toggle(idx) : undefined}
            >
              <div className="row" style={{ marginBottom: trade.aiBlocks.length > 0 || isExpanded ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Pill variant={trade.type}>{trade.typeLabel}</Pill>
                  <div className="stock-cell">
                    <div className="logo-sm">{trade.logo}</div>
                    <div>
                      <div className="strong">{trade.name} {trade.qty}주</div>
                      <div className="muted" style={{ fontSize: 12 }}>체결가 {trade.execPrice}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`strong ${trade.returnUp ? 'price-up' : 'price-down'}`} style={{ fontSize: 16 }}>
                      {trade.returnPct}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>{trade.returnLabel}</div>
                  </div>
                  {trade.aiBlocks.length === 0 && (
                    <span style={{ color: 'var(--t3)', fontSize: 18 }}>{isExpanded ? '▴' : '▾'}</span>
                  )}
                </div>
              </div>

              {trade.aiBlocks.length > 0 && (
                <>
                  {trade.aiBlocks.map((block, bi) => (
                    <div key={bi} className="ai-block" style={{ marginBottom: bi < trade.aiBlocks.length - 1 ? 10 : 0 }}>
                      <span className="ai-tag">{block.tag}</span>
                      <span style={{ fontSize: 14, lineHeight: 1.6 }}>{block.text}</span>
                    </div>
                  ))}
                </>
              )}
            </Card>
          </div>
        )
      })}
    </AppLayout>
  )
}
