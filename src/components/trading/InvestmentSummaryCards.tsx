import Card from '../common/Card'
import { format_money, format_rate } from '../../hooks/useTradeHistory'

interface InvestmentSummaryCardsProps {
  summary: {
    cashBalance: number
    stockValue: number
    totalAsset: number
    totalProfit: number
    totalProfitRate: number
    holdingCount: number
    tradeCount: number
  }
}

export default function InvestmentSummaryCards({ summary }: InvestmentSummaryCardsProps) {
  const profitClass = summary.totalProfit >= 0 ? 'price-up' : 'price-down'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
      <Card>
        <div className="muted" style={{ fontSize: 12 }}>총 자산</div>
        <div className="strong" style={{ fontSize: 24, marginTop: 6 }}>{format_money(summary.totalAsset)}</div>
        <div className={profitClass} style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>
          {format_money(summary.totalProfit)} · {format_rate(summary.totalProfitRate)}
        </div>
      </Card>
      <Card>
        <div className="muted" style={{ fontSize: 12 }}>주식 평가금액</div>
        <div className="strong" style={{ fontSize: 24, marginTop: 6 }}>{format_money(summary.stockValue)}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>보유 {summary.holdingCount.toLocaleString()}종목</div>
      </Card>
      <Card>
        <div className="muted" style={{ fontSize: 12 }}>예수금</div>
        <div className="strong" style={{ fontSize: 24, marginTop: 6 }}>{format_money(summary.cashBalance)}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>매수 가능 금액</div>
      </Card>
      <Card>
        <div className="muted" style={{ fontSize: 12 }}>기간 내 거래</div>
        <div className="strong" style={{ fontSize: 24, marginTop: 6 }}>{summary.tradeCount.toLocaleString()}건</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>선택 기간 기준</div>
      </Card>
    </div>
  )
}
