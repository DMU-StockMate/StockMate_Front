import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Chip, { ChipRow } from '../components/common/Chip'
import {
  fmt_money,
  fmt_price,
  fmt_rate,
  fmt_volume,
  get_price,
  get_rate,
  get_volume,
  type MarketFilter,
  type StockViewFilter,
  useTradeStocks,
} from '../hooks/useTradeStocks'
import { useWatchlist } from '../hooks/useWatchlist'

type CombinedFilter =
  | { type: 'view'; key: StockViewFilter; label: string }
  | { type: 'market'; key: Exclude<MarketFilter, '전체'>; label: string }

const FILTERS: CombinedFilter[] = [
  { type: 'view', key: 'all', label: '전체' },
  { type: 'view', key: 'volume', label: '거래량' },
  { type: 'view', key: 'rise', label: '급상승' },
  { type: 'view', key: 'fall', label: '급하락' },
  { type: 'market', key: 'KOSPI', label: '코스피' },
  { type: 'market', key: 'KOSDAQ', label: '코스닥' },
  { type: 'market', key: 'KONEX', label: '코넥스' },
]

const VIEW_FILTER_LABELS: Record<StockViewFilter, string> = {
  all: '전체 종목 둘러보기',
  rise: '급상승 종목',
  fall: '급하락 종목',
  volume: '거래량 상위 종목',
}

export default function TradeStocksPage() {
  const navigate = useNavigate()
  const tradeStocks = useTradeStocks()
  const watchlist = useWatchlist()
  const [qtyText, setQtyText] = useState(String(tradeStocks.tradeQty))
  useEffect(() => { setQtyText(String(tradeStocks.tradeQty)) }, [tradeStocks.tradeQty])
  useEffect(() => {
    if (!tradeStocks.tradeModal.open) return
    const handle_key_down = (event: KeyboardEvent) => {
      if (event.key === 'Escape') tradeStocks.closeTradeModal()
    }
    window.addEventListener('keydown', handle_key_down)
    return () => window.removeEventListener('keydown', handle_key_down)
  }, [tradeStocks.tradeModal.open, tradeStocks.closeTradeModal])
  const isFilterActive = (filter: CombinedFilter) =>
    filter.type === 'view'
      ? tradeStocks.viewFilter === filter.key && tradeStocks.market === '전체'
      : tradeStocks.viewFilter === 'all' && tradeStocks.market === filter.key

  const handleFilterClick = (filter: CombinedFilter) => {
    if (filter.type === 'view') {
      tradeStocks.handleMarketChange('전체')
      tradeStocks.handleViewFilterChange(filter.key)
      return
    }

    tradeStocks.handleViewFilterChange('all')
    tradeStocks.handleMarketChange(filter.key)
  }

  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/trade')}>모의투자</span>
        <span className="bc-sep">›</span>
        {tradeStocks.isSearchMode ? (
          <>
            <span className="bc-link" onClick={tradeStocks.handleClear}>전체 종목</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">검색 결과</span>
          </>
        ) : (
          <span className="bc-current">전체 종목 둘러보기</span>
        )}
      </div>

      <div className="page-title">
        <div>
          <h1>{tradeStocks.isSearchMode ? `"${tradeStocks.keyword}" 검색 결과` : VIEW_FILTER_LABELS[tradeStocks.viewFilter]}</h1>
          <div className="page-sub">
            {tradeStocks.loading ? '불러오는 중...' : `${tradeStocks.total.toLocaleString()}개 종목`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => navigate('/trade')}>
            <i className="bi bi-chevron-left" />
            모의투자로
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 16, padding: '18px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'center' }}>
          <div>
            <div className="label">가용 예수금</div>
            <div className="strong" style={{ fontSize: 22, marginTop: 6 }}>{fmt_money(tradeStocks.account?.cashBalance)}</div>
          </div>
          <div>
            <div className="label">보유 종목</div>
            <div className="strong" style={{ fontSize: 22, marginTop: 6 }}>{tradeStocks.holdings.length.toLocaleString()}개</div>
          </div>
          <div>
            <div className="label">최근 체결</div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--t2)' }}>
              {tradeStocks.recentTrades[0]
                ? `${tradeStocks.recentTrades[0].companyName} ${tradeStocks.recentTrades[0].tradeType === 'BUY' ? '매수' : '매도'} ${tradeStocks.recentTrades[0].quantity}주 · ${fmt_money(tradeStocks.recentTrades[0].totalAmount)}`
                : '아직 체결 내역이 없습니다.'}
            </div>
          </div>
        </div>
      </Card>

      {tradeStocks.tradeMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            background: tradeStocks.tradeMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            color: tradeStocks.tradeMessage.type === 'success' ? 'var(--success)' : 'var(--up)',
            border: `1px solid ${tradeStocks.tradeMessage.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
          }}
        >
          {tradeStocks.tradeMessage.text}
        </div>
      )}

      <Card style={{ marginBottom: 16, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="bi bi-search" style={{ fontSize: 16, color: 'var(--primary)' }} />
          <input
            type="text"
            value={tradeStocks.searchInput}
            onChange={(e) => tradeStocks.setSearchInput(e.target.value)}
            onKeyDown={tradeStocks.handleKeyDown}
            placeholder="종목명, 종목코드를 입력하세요 (예: 삼성전자, 005930)"
            style={{ flex: 1, fontSize: 15, border: 'none', outline: 'none', color: 'var(--t1)', background: 'transparent' }}
          />
          {tradeStocks.searchInput && (
            <button className="btn btn-sm btn-outline" onClick={tradeStocks.handleClear}>
              <i className="bi bi-x-lg" />
            </button>
          )}
          <Button size="sm" onClick={tradeStocks.handleSearch}>검색</Button>
        </div>
      </Card>

      <div className="row" style={{ marginBottom: 16 }}>
        <ChipRow>
          {FILTERS.map((filter) => (
            <Chip
              key={`${filter.type}-${filter.key}`}
              active={isFilterActive(filter)}
              onClick={() => handleFilterClick(filter)}
            >
              {filter.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {tradeStocks.loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>종목을 불러오는 중...</div>
        ) : tradeStocks.stocks.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>
            {tradeStocks.isSearchMode ? `"${tradeStocks.keyword}"에 해당하는 종목이 없습니다.` : '종목이 없습니다.'}
          </div>
        ) : (
          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--primary-subtle)' }}>
                <th style={{ paddingLeft: 24 }}>종목</th>
                <th>시장</th>
                <th>섹터</th>
                <th>통화</th>
                <th>현재가</th>
                <th>등락률</th>
                <th>거래량</th>
                <th>보유</th>
                <th>상태</th>
                <th style={{ paddingRight: 24 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {tradeStocks.stocks.map((stock) => {
                const price = tradeStocks.prices[stock.ticker]
                const currentPrice = get_price(price)
                const changeRate = get_rate(price)
                const volume = get_volume(price) || get_volume(stock)
                const holding = tradeStocks.holdingsByTicker[stock.ticker]
                const isUp = (changeRate ?? 0) > 0
                const isDown = (changeRate ?? 0) < 0
                return (
                  <tr key={stock.ticker} onClick={() => navigate(`/trade/stocks/${stock.ticker}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ paddingLeft: 24 }}>
                      <div className="stock-cell">
                        <div className="logo-sm" style={{ fontSize: 11 }}>{stock.companyName.slice(0, 2)}</div>
                        <div>
                          <div className="strong">{stock.companyName}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{stock.ticker}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>{stock.market ?? '-'}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{stock.sector ?? '-'}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{stock.currency}</td>
                    <td style={{ fontWeight: 700, fontSize: 14 }}>{fmt_price(currentPrice)}</td>
                    <td style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: isUp ? 'var(--up)' : isDown ? 'var(--down)' : 'var(--t2)',
                    }}>
                      {fmt_rate(changeRate)}
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>{fmt_volume(volume)}</td>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {holding ? `${holding.quantity.toLocaleString()}주` : '-'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 12,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontWeight: 600,
                        background: stock.status === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(107,101,128,0.12)',
                        color: stock.status === 'ACTIVE' ? 'var(--success)' : 'var(--t3)',
                      }}>
                        {stock.status === 'ACTIVE' ? '거래가능' : stock.status === 'SUSPENDED' ? '거래정지' : '상장폐지'}
                      </span>
                    </td>
                    <td style={{ paddingRight: 24 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          disabled={watchlist.actionTicker === stock.ticker}
                          title={watchlist.isInWatchlist(stock.ticker) ? '관심 종목 삭제' : '관심 종목 추가'}
                          onClick={() => void watchlist.toggleStock(stock)}
                        >
                          <i className={`bi ${watchlist.isInWatchlist(stock.ticker) ? 'bi-star-fill' : 'bi-star'}`} />
                        </button>
                        <button
                          className="btn btn-sm btn-up"
                          disabled={stock.status !== 'ACTIVE'}
                          onClick={(e) => { e.stopPropagation(); tradeStocks.openTradeModal('buy', stock) }}
                        >
                          매수
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          disabled={!holding || stock.status !== 'ACTIVE'}
                          onClick={(e) => { e.stopPropagation(); tradeStocks.openTradeModal('sell', stock) }}
                        >
                          매도
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {!tradeStocks.loading && tradeStocks.totalPages > 1 && (
          <div className="row" style={{ padding: '14px 24px', borderTop: '1px solid var(--border)' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {(tradeStocks.page - 1) * tradeStocks.LIMIT + 1}–{Math.min(tradeStocks.page * tradeStocks.LIMIT, tradeStocks.total)} / {tradeStocks.total.toLocaleString()}개 종목
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Button size="sm" variant="outline" onClick={() => tradeStocks.setPage((p) => p - 1)} disabled={tradeStocks.page === 1}>← 이전</Button>
              {Array.from({ length: Math.min(5, tradeStocks.totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(tradeStocks.page - 2, tradeStocks.totalPages - 4)) + i
                return <Chip key={page} active={page === tradeStocks.page} onClick={() => tradeStocks.setPage(page)}>{page}</Chip>
              })}
              <Button size="sm" variant="outline" onClick={() => tradeStocks.setPage((p) => p + 1)} disabled={tradeStocks.page === tradeStocks.totalPages}>다음 →</Button>
            </div>
          </div>
        )}
      </Card>

      {tradeStocks.tradeModal.open && tradeStocks.tradeModal.stock && (
        <div className="modal-backdrop" onClick={tradeStocks.closeTradeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ marginBottom: 18 }}>
              <h2>주문하기</h2>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--t2)' }}
                onClick={tradeStocks.closeTradeModal}
                disabled={tradeStocks.tradeLoading}
              >
                ×
              </button>
            </div>

            <div className="trade-tab" style={{ marginBottom: 18 }}>
              <button
                className={tradeStocks.tradeModal.mode === 'buy' ? 'active-tab' : 'inactive-tab'}
                onClick={() => {
                  tradeStocks.setTradeModal((modal) => ({ ...modal, mode: 'buy' }))
                  tradeStocks.setTradeQty(1)
                  tradeStocks.setTradeMessage(null)
                }}
                disabled={tradeStocks.tradeLoading}
              >
                매수
              </button>
              <button
                className={tradeStocks.tradeModal.mode === 'sell' ? 'active-tab' : 'inactive-tab'}
                style={tradeStocks.tradeModal.mode === 'sell' ? { background: 'var(--down)', color: '#fff' } : {}}
                onClick={() => {
                  tradeStocks.setTradeModal((modal) => ({ ...modal, mode: 'sell' }))
                  tradeStocks.setTradeQty(1)
                  tradeStocks.setTradeMessage(null)
                }}
                disabled={tradeStocks.tradeLoading}
              >
                매도
              </button>
            </div>

            <div className="card" style={{ background: 'var(--primary-subtle)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}>
              <div className="row">
                <div className="stock-cell">
                  <div className="logo-sm">{tradeStocks.tradeModal.stock.companyName.slice(0, 2)}</div>
                  <div>
                    <div className="strong">{tradeStocks.tradeModal.stock.companyName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{tradeStocks.tradeModal.stock.ticker}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="strong" style={{ fontSize: 16 }}>{fmt_price(tradeStocks.selectedPrice)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    보유 {tradeStocks.selectedHolding ? `${tradeStocks.selectedHolding.quantity.toLocaleString()}주` : '0주'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div className="label" style={{ marginBottom: 10 }}>수량 (1주 단위)</div>
              <div className="stepper">
                <button disabled={tradeStocks.tradeLoading} onClick={() => tradeStocks.setTradeQty((qty) => Math.max(1, qty - 1))}>−</button>
                <input
                  className="qty"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qtyText}
                  disabled={tradeStocks.tradeLoading}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw !== '' && !/^\d+$/.test(raw)) {
                      window.alert('숫자만 입력할 수 있습니다.')
                      return
                    }
                    setQtyText(raw)
                    const n = Math.floor(Number(raw))
                    if (raw !== '' && Number.isFinite(n) && n > 0) tradeStocks.setTradeQty(n)
                  }}
                  onBlur={() => { if (!qtyText || Number(qtyText) < 1) tradeStocks.setTradeQty(1) }}
                />
                <button disabled={tradeStocks.tradeLoading} onClick={() => tradeStocks.setTradeQty((qty) => qty + 1)}>+</button>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--bg)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">예상 체결금액</span>
                <span className="strong">{tradeStocks.selectedPrice > 0 ? fmt_money(tradeStocks.orderAmount) : '최신 종가로 체결'}</span>
              </div>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">가용 예수금</span>
                <span>{fmt_money(tradeStocks.account?.cashBalance)}</span>
              </div>
              <div className="row" style={{ fontSize: 13 }}>
                <span className="muted">{tradeStocks.tradeModal.mode === 'buy' ? '매수 후 잔여' : '매도 후 예수금'}</span>
                <span className="strong" style={{ color: tradeStocks.expectedCash < 0 ? 'var(--up)' : 'var(--primary)' }}>
                  {tradeStocks.selectedPrice > 0 ? fmt_money(tradeStocks.expectedCash) : '-'}
                </span>
              </div>
            </div>

            {tradeStocks.tradeMessage?.type === 'error' && (
              <div style={{ marginBottom: 14, color: 'var(--up)', fontSize: 13 }}>
                {tradeStocks.tradeMessage.text}
              </div>
            )}

            <button
              className={`btn btn-lg ${tradeStocks.tradeModal.mode === 'buy' ? 'btn-up' : 'btn-down'}`}
              style={{ width: '100%' }}
              disabled={!tradeStocks.canSubmitTrade}
              onClick={tradeStocks.submitTrade}
            >
              {tradeStocks.tradeLoading ? '주문 처리 중...' : tradeStocks.tradeModal.mode === 'buy' ? '매수하기' : '매도하기'}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
