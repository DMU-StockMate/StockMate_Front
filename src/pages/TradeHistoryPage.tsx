import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/common/Button'
import Chip, { ChipRow } from '../components/common/Chip'
import InvestmentSummaryCards from '../components/trading/InvestmentSummaryCards'
import HoldingStatusTable from '../components/trading/HoldingStatusTable'
import TradeHistoryList from '../components/trading/TradeHistoryList'
import { useTradeHistory, type TradeHistoryPeriod } from '../hooks/useTradeHistory'

const PERIODS: TradeHistoryPeriod[] = ['1주', '1개월', '3개월', '전체']

export default function TradeHistoryPage() {
  const navigate = useNavigate()
  const {
    period,
    setPeriod,
    holdings,
    trades,
    summary,
    loading,
    error,
    reload,
    exportCsv,
  } = useTradeHistory()

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
          <div className="page-sub">보유 종목과 매매 기록을 실제 계좌 데이터로 확인하세요</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={reload} disabled={loading}>
            <i className="bi bi-arrow-clockwise" />
            새로고침
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={loading || (holdings.length === 0 && trades.length === 0)}>
            <i className="bi bi-download" />
            CSV 내보내기
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <ChipRow>
          {PERIODS.map((p) => (
            <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>{p}</Chip>
          ))}
        </ChipRow>
      </div>

      {error && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          background: 'var(--up-light)',
          color: 'var(--up)',
          fontSize: 13,
          border: '1px solid var(--up-border, #FCA5A5)',
        }}>
          {error}
        </div>
      )}

      <InvestmentSummaryCards summary={summary} />
      <HoldingStatusTable holdings={holdings} loading={loading} />
      <TradeHistoryList trades={trades} period={period} loading={loading} />
    </AppLayout>
  )
}
