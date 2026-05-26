import Card from '../common/Card'
import Pill from '../common/Pill'
import { format_datetime, format_money, type TradeHistoryPeriod } from '../../hooks/useTradeHistory'
import type { Trade } from '../../api/trading'

interface TradeHistoryListProps {
  trades: Trade[]
  period: TradeHistoryPeriod
  loading: boolean
}

export default function TradeHistoryList({ trades, period, loading }: TradeHistoryListProps) {
  return (
    <Card>
      <div className="row" style={{ marginBottom: 14 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>거래 내역</div>
          <div className="muted" style={{ fontSize: 12 }}>{period} 기준 체결 기록</div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--t2)' }}>거래 내역을 불러오는 중입니다.</div>
      )}

      {!loading && trades.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--t2)' }}>선택한 기간에 거래 내역이 없습니다.</div>
      )}

      {!loading && trades.map((trade) => {
        const isBuy = trade.tradeType === 'BUY'
        const realized = trade.realizedProfit ? Number(trade.realizedProfit) : null
        return (
          <div key={trade.tradeId} style={{ borderTop: '1px solid var(--border)', padding: '14px 0' }}>
            <div className="row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Pill variant={isBuy ? 'up' : 'down'}>{isBuy ? '매수' : '매도'}</Pill>
                <div className="stock-cell">
                  <div className="logo-sm">{trade.companyName.slice(0, 2)}</div>
                  <div>
                    <div className="strong">{trade.companyName} {trade.quantity.toLocaleString()}주</div>
                    <div className="muted" style={{ fontSize: 12 }}>{trade.ticker} · {format_datetime(trade.createdAt)}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="strong">{format_money(trade.totalAmount)}</div>
                <div className="muted" style={{ fontSize: 12 }}>체결가 {format_money(trade.price)}</div>
                {realized !== null && (
                  <div className={realized >= 0 ? 'price-up' : 'price-down'} style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                    실현손익 {format_money(realized)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}
