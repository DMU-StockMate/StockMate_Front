import { useNavigate } from 'react-router-dom'
import Card from '../common/Card'
import { format_money, format_rate, type HoldingStatus } from '../../hooks/useTradeHistory'

interface HoldingStatusTableProps {
  holdings: HoldingStatus[]
  loading: boolean
}

export default function HoldingStatusTable({ holdings, loading }: HoldingStatusTableProps) {
  const navigate = useNavigate()

  return (
    <Card style={{ marginBottom: 20 }}>
      <div className="row" style={{ marginBottom: 14 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>보유 종목 현황</div>
          <div className="muted" style={{ fontSize: 12 }}>현재가 기준 평가 손익을 확인하세요</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['종목', '보유수량', '평균단가', '현재가', '평가금액', '평가손익'].map((header) => (
                <th key={header} style={{ padding: '10px 8px', fontSize: 12, color: 'var(--t3)', textAlign: header === '종목' ? 'left' : 'right' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--t2)' }}>보유 종목을 불러오는 중입니다.</td>
              </tr>
            )}
            {!loading && holdings.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--t2)' }}>아직 보유 중인 종목이 없습니다.</td>
              </tr>
            )}
            {!loading && holdings.map((holding) => {
              const profitClass = holding.profitAmount >= 0 ? 'price-up' : 'price-down'
              return (
                <tr
                  key={holding.holdingId}
                  onClick={() => navigate(`/trade/stocks/${holding.ticker}`)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '14px 8px' }}>
                    <div className="stock-cell">
                      <div className="logo-sm">{holding.companyName.slice(0, 2)}</div>
                      <div>
                        <div className="strong">{holding.companyName}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{holding.ticker}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontSize: 13 }}>{holding.quantity.toLocaleString()}주</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontSize: 13 }}>{format_money(holding.averagePriceNum)}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontSize: 13 }}>{format_money(holding.currentPrice)}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{format_money(holding.evaluationAmount)}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                    <div className={profitClass} style={{ fontWeight: 800 }}>{format_money(holding.profitAmount)}</div>
                    <div className={profitClass} style={{ fontSize: 12 }}>{format_rate(holding.profitRate)}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
