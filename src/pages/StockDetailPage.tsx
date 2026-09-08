import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import type { StockDetail, StockSummary } from '../api/stocks'
import { useStockDetailData, type StockChartPeriod } from '../hooks/useStockDetailData'
import { useWatchlist } from '../hooks/useWatchlist'
import PriceChart from '../components/stock/PriceChart'
import InvestorTrendCard from '../components/stock/InvestorTrendCard'
import RangeBar from '../components/stock/RangeBar'
import { to_num, fmt_price, fmt_rate, fmt_val, fmt_indicator, fmt_market_cap, price_of } from '../utils/format'

const PERIOD_LABELS: Record<StockChartPeriod, string> = { daily: '일봉', weekly: '주봉', monthly: '월봉' }

type DetailTab = 'chart' | 'info' | 'news' | 'community'

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'chart', label: '차트' },
  { key: 'info', label: '종목정보' },
  { key: 'news', label: '뉴스·공시' },
  { key: 'community', label: '커뮤니티' },
]

const as_object = (value: unknown): Record<string, unknown> =>
  value != null && typeof value === 'object' ? value as Record<string, unknown> : {}

const unwrap_payload = (value: unknown) => {
  const obj = as_object(value)
  const nested = as_object(
    obj.data ?? obj.summary ?? obj.price ?? obj.latestPrice ?? obj.latest,
  )
  return { ...nested, ...obj }
}

const pick_num = (...sources: unknown[]) => {
  for (const source of sources) {
    const value = to_num(source)
    if (value !== 0) return value
  }
  return 0
}

const pick_text = (...sources: unknown[]) => {
  for (const source of sources) {
    if (typeof source === 'string' && source.trim()) return source
    if (typeof source === 'number') return String(source)
  }
  return ''
}

const get_price_summary = (summary: StockSummary | null, stock: StockDetail | null) => {
  const s = unwrap_payload(summary)
  const stockObj = as_object(stock)
  const detail = as_object(stockObj.detail)

  return {
    currentPrice: pick_num(s.currentPrice, s.closePrice, s.price, s.close, s.tradePrice, stockObj.currentPrice, stockObj.closePrice),
    changeRate: pick_num(
      s.changeRate,
      s.change_rate,
      s.rate,
      s.changePercent,
      s.change_percent,
      s.fluctuationRate,
      s.fluctuation_rate,
      s.signedChangeRate,
      s.signed_change_rate,
      stockObj.changeRate,
      stockObj.change_rate,
      stockObj.rate,
    ),
    volume: pick_num(s.volume, s.accTradeVolume, s.tradingVolume, stockObj.volume),
    marketCap: pick_num(s.marketCap, s.marketCapitalization, s.market_cap, detail.marketCap),
    highPrice: pick_num(s.highPrice, s.high),
    lowPrice: pick_num(s.lowPrice, s.low),
    openPrice: pick_num(s.openPrice, s.open),
    sector: pick_text(s.sector, s.sectorName, stockObj.sector),
  }
}


/* ── 메인 페이지 ── */
export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<DetailTab>('chart')
  const {
    account,
    chartData,
    chartLoading,
    disclosures,
    dividends,
    financials,
    holdings,
    indicators,
    indicatorSyncing,
    investorTrend,
    investorTrendLoading,
    loading,
    modal,
    period,
    qty,
    setModal,
    setPeriod,
    setQty,
    stock,
    submitTrade,
    summary,
    tradeLoading,
    tradeMessage,
  } = useStockDetailData(ticker)
  const watchlist = useWatchlist()

  if (loading) {
    return (
      <AppLayout topbarPlaceholder="종목 검색">
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--t2)' }}>종목 정보를 불러오는 중...</div>
      </AppLayout>
    )
  }

  if (!stock) {
    return (
      <AppLayout topbarPlaceholder="종목 검색">
        <div style={{ padding: 80, textAlign: 'center', color: 'var(--t3)' }}>
          종목을 찾을 수 없습니다.
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => navigate('/trade/stocks')}>← 종목 목록으로</Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const marketSummary = get_price_summary(summary, stock)
  const currentPrice = marketSummary.currentPrice
  const changeRate = marketSummary.changeRate
  const isUp = changeRate >= 0
  const priceColor = isUp ? 'var(--up)' : 'var(--down)'
  const isWatchlisted = watchlist.isInWatchlist(stock.ticker)
  const currentHolding = holdings.find((holding) => holding.ticker === stock.ticker)
  const virtualCash = to_num(account?.cashBalance)
  const totalOrderPrice = currentPrice * qty
  const canSubmitTrade =
    qty > 0 &&
    !tradeLoading &&
    currentPrice > 0 &&
    (modal.mode === 'buy'
      ? virtualCash >= totalOrderPrice
      : (currentHolding?.quantity ?? 0) >= qty)
  const latestCandle = chartData[chartData.length - 1] as unknown as Record<string, unknown> | undefined
  const todayLow = latestCandle ? price_of(latestCandle, ['lowPrice', 'low']) : 0
  const todayHigh = latestCandle ? price_of(latestCandle, ['highPrice', 'high']) : 0
  const yearCandles = period === 'daily' ? chartData.slice(-252) : []
  const yearLows = yearCandles.map((row) => price_of(row as unknown as Record<string, unknown>, ['lowPrice', 'low'])).filter((v) => v > 0)
  const yearHighs = yearCandles.map((row) => price_of(row as unknown as Record<string, unknown>, ['highPrice', 'high'])).filter((v) => v > 0)
  const yearLow = yearLows.length > 0 ? Math.min(...yearLows) : 0
  const yearHigh = yearHighs.length > 0 ? Math.max(...yearHighs) : 0
  const latestInvestorDay = investorTrend[investorTrend.length - 1]

  const indicatorValues = indicators?.indicators
  const hasFinancialIndicators = Boolean(
    indicators?.dataAvailability?.financialIndicators ||
    (indicatorValues && Object.values(indicatorValues).some((value) => to_num(value) !== 0)),
  )
  const hasBasicIndicators = Boolean(
    indicators && [
      indicators.marketCap,
      indicators.estimatedMarketCap,
      indicators.totalShares,
      indicators.currentPrice,
      indicators.previousClosePrice,
    ].some((value) => to_num(value) !== 0),
  )
  const hasIndicators = hasFinancialIndicators || hasBasicIndicators

  const submit_trade = () => submitTrade(currentPrice, canSubmitTrade)

  return (
    <AppLayout topbarPlaceholder="종목 검색" hasWishlist>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/trade')}>모의투자</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => navigate('/trade/stocks')}>전체 종목</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{stock.companyName}</span>
      </div>

      {tradeMessage && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            border: `1px solid ${tradeMessage.type === 'success' ? 'var(--up)' : 'var(--down)'}`,
            color: tradeMessage.type === 'success' ? 'var(--up)' : 'var(--down)',
            boxShadow: 'none',
          }}
        >
          {tradeMessage.text}
        </div>
      )}

      {watchlist.error && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            border: '1px solid var(--up)',
            color: 'var(--up)',
            boxShadow: 'none',
          }}
        >
          {watchlist.error}
        </div>
      )}

      {/* ── 헤더 카드 ── */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="logo-sm" style={{ width: 52, height: 52, borderRadius: 14, fontSize: 18, flexShrink: 0 }}>
              {stock.companyName.slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)' }}>{stock.companyName}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="muted">{stock.ticker}</span>
                {stock.market && <span className="muted">· {stock.market}</span>}
                {(marketSummary.sector || stock.sector) && <span className="muted">· {marketSummary.sector || stock.sector}</span>}
                <span style={{
                  fontSize: 12, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                  background: stock.status === 'ACTIVE' ? 'rgba(16,185,129,0.12)' : 'rgba(107,101,128,0.12)',
                  color: stock.status === 'ACTIVE' ? 'var(--success)' : 'var(--t3)',
                }}>
                  {stock.status === 'ACTIVE' ? '거래가능' : stock.status === 'SUSPENDED' ? '거래정지' : '상장폐지'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {currentPrice > 0 ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2 }}>{currentPrice.toLocaleString()}원</div>
                <div style={{ color: priceColor, fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                  {fmt_rate(changeRate)}
                </div>
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>가격 정보 없음</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outline"
                disabled={watchlist.actionTicker === stock.ticker}
                title={isWatchlisted ? '관심 종목 삭제' : '관심 종목 추가'}
                onClick={() => void watchlist.toggleStock(stock)}
              >
                <i className={`bi ${isWatchlisted ? 'bi-star-fill' : 'bi-star'}`} />
                {isWatchlisted ? '관심종목 해제' : '관심종목'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/community?board=STOCK&ticker=${stock.ticker}&name=${encodeURIComponent(stock.companyName)}`)}
              >
                <i className="bi bi-chat-square-text" />
                종목 게시판
              </Button>
              <Button variant="outline" onClick={() => { setModal({ open: true, mode: 'sell' }); setQty(1) }}>
                매도
              </Button>
              <Button disabled={stock.status !== 'ACTIVE'} onClick={() => { setModal({ open: true, mode: 'buy' }); setQty(1) }}>
                매수
              </Button>
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <RangeBar label="1일 범위" low={todayLow} high={todayHigh} current={currentPrice} />
            {period === 'daily' && <RangeBar label="52주 범위" low={yearLow} high={yearHigh} current={currentPrice} />}
            {latestInvestorDay && (
              <>
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 2 }}>외국인 순매수</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: latestInvestorDay.foreignNet >= 0 ? 'var(--up)' : 'var(--down)' }}>
                    {latestInvestorDay.foreignNet >= 0 ? '+' : ''}{Math.round(latestInvestorDay.foreignNet / 100000000).toLocaleString()}억
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 2 }}>기관 순매수</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: latestInvestorDay.institutionNet >= 0 ? 'var(--up)' : 'var(--down)' }}>
                    {latestInvestorDay.institutionNet >= 0 ? '+' : ''}{Math.round(latestInvestorDay.institutionNet / 100000000).toLocaleString()}억
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* ── 탭 ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--primary)' : 'transparent'}`,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--t3)',
              marginBottom: -1, transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 차트 + 투자자 동향 ── */}
      {activeTab === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>
          <Card style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>주가 차트</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['daily', 'weekly', 'monthly'] as StockChartPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      height: 32, padding: '0 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: '1px solid var(--border)', cursor: 'pointer',
                      background: period === p ? 'var(--primary)' : '#fff',
                      color: period === p ? '#fff' : 'var(--t2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            {chartLoading ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)', fontSize: 13 }}>
                차트를 불러오는 중...
              </div>
            ) : (
              <PriceChart data={chartData} />
            )}
            {chartData.length > 0 && (
              <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {[
                  { label: '시가', value: fmt_price(price_of(chartData[chartData.length - 1], ['openPrice', 'open'])) },
                  { label: '고가', value: fmt_price(price_of(chartData[chartData.length - 1], ['highPrice', 'high'])) },
                  { label: '저가', value: fmt_price(price_of(chartData[chartData.length - 1], ['lowPrice', 'low'])) },
                  { label: '종가', value: fmt_price(price_of(chartData[chartData.length - 1], ['closePrice', 'close'])) },
                  { label: '거래량', value: fmt_val((chartData[chartData.length - 1] as unknown as Record<string, unknown>).volume, '주') },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="label" style={{ marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="section-title" style={{ marginBottom: 16 }}>개인·외국인·기관</div>
            <InvestorTrendCard days={investorTrend} loading={investorTrendLoading} />
          </Card>
        </div>
      )}

      {/* ── 종목정보: 시장 요약 + 투자 지표 + 재무제표 ── */}
      {activeTab === 'info' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card>
              <div className="section-title" style={{ marginBottom: 16 }}>시장 요약</div>
              {summary || currentPrice > 0 || marketSummary.volume > 0 || marketSummary.marketCap > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: '현재가', value: fmt_price(currentPrice) },
                    { label: '등락률', value: fmt_rate(changeRate) },
                    { label: '거래량', value: marketSummary.volume ? fmt_val(marketSummary.volume, '주') : '-' },
                    { label: '시가총액', value: fmt_market_cap(marketSummary.marketCap) },
                  ].map(({ label, value }) => (
                    <div key={label} className="metric">
                      <div className="lbl">{label}</div>
                      <div className="val" style={{ fontSize: 15 }}>{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>시장 데이터가 없습니다</div>
              )}
            </Card>

            <Card>
              <div className="section-title" style={{ marginBottom: 16 }}>투자 지표</div>
              {indicatorSyncing ? (
                <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
                  DART에서 재무 지표를 불러오는 중...
                </div>
              ) : hasIndicators ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'PER', value: fmt_indicator(indicatorValues?.per, '배') },
                    { label: 'PBR', value: fmt_indicator(indicatorValues?.pbr, '배') },
                    { label: 'ROE', value: fmt_indicator(indicatorValues?.roe, '%') },
                    { label: 'EPS', value: fmt_indicator(indicatorValues?.eps, '원') },
                    { label: 'BPS', value: fmt_indicator(indicatorValues?.bps, '원') },
                    { label: '배당수익률', value: fmt_indicator(indicatorValues?.dividendYield, '%') },
                    { label: '시가총액', value: fmt_market_cap(indicators?.marketCap ?? indicators?.estimatedMarketCap) },
                    { label: '상장주식수', value: fmt_val(indicators?.totalShares, '주') },
                  ].map(({ label, value }) => (
                    <div key={label} className="metric">
                      <div className="lbl">{label}</div>
                      <div className="val" style={{ fontSize: 15 }}>{value}</div>
                    </div>
                  ))}
                  {(indicators?.indicatorTradeDate || indicators?.tradeDate) && (
                    <div className="muted" style={{ gridColumn: '1 / -1', fontSize: 12, paddingTop: 4 }}>
                      기준일 {indicators.indicatorTradeDate ?? indicators.tradeDate}
                      {indicators.indicatorSource === 'DART' && ' · DART 재무제표 기반 계산'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>지표 데이터가 없습니다</div>
              )}
            </Card>
          </div>

          {financials && Object.keys(financials).length > 0 && (
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 6 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>재무제표</div>
                {Boolean(financials.businessYear || financials.reportName) && (
                  <span className="muted" style={{ fontSize: 12 }}>
                    {financials.businessYear as string}년 {financials.reportName as string} 기준
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {Object.entries(financials)
                  .filter(([key, v]) => typeof v === 'number' && key !== 'businessYear')
                  .map(([key, value]) => (
                    <div key={key} className="metric">
                      <div className="lbl">{key}</div>
                      <div className="val" style={{ fontSize: 14 }}>{fmt_market_cap(value)}</div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── 뉴스·공시 + 배당 ── */}
      {activeTab === 'news' && (
        <>
          {disclosures.length > 0 ? (
            <Card style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>뉴스 공시</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {disclosures.map((item) => (
                  <a
                    key={item.rceptNo}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      padding: '10px 8px', borderRadius: 8, textDecoration: 'none', color: 'inherit',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-subtle)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                      {item.remark && <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>[{item.remark}]</span>}
                    </span>
                    <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>
                      {item.submitter} · {item.receiptDate.slice(0, 4)}.{item.receiptDate.slice(4, 6)}.{item.receiptDate.slice(6, 8)}
                    </span>
                  </a>
                ))}
              </div>
            </Card>
          ) : (
            <Card style={{ marginBottom: 20 }}>
              <div className="muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>최근 공시가 없습니다</div>
            </Card>
          )}
        </>
      )}

      {/* ── 커뮤니티 ── */}
      {activeTab === 'community' && (
        <Card style={{ marginBottom: 20, textAlign: 'center', padding: '48px 24px' }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            {stock.companyName} 종목 게시판에서 다른 투자자들과 의견을 나눠보세요
          </div>
          <Button onClick={() => navigate(`/community?board=STOCK&ticker=${stock.ticker}&name=${encodeURIComponent(stock.companyName)}`)}>
            <i className="bi bi-chat-square-text" /> 종목 게시판 열기
          </Button>
        </Card>
      )}

      {/* ── 배당 정보 ── */}
      {activeTab === 'news' && dividends.length > 0 && (
        <Card style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 12px' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>배당 정보</div>
          </div>
          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--primary-subtle)' }}>
                {Object.keys(dividends[0]).map((k) => (
                  <th key={k} style={{ paddingLeft: 24 }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dividends.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => (
                    <td key={j} className="muted" style={{ fontSize: 13, paddingLeft: 24 }}>
                      {typeof v === 'number' ? v.toLocaleString() : String(v ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── 매수/매도 모달 ── */}
      {modal.open && (
        <div className="modal-backdrop" onClick={() => setModal((m) => ({ ...m, open: false }))}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ marginBottom: 18 }}>
              <h2>주문하기</h2>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--t2)' }}
                onClick={() => setModal((m) => ({ ...m, open: false }))}
              >×</button>
            </div>

            <div className="trade-tab" style={{ marginBottom: 18 }}>
              <button
                className={modal.mode === 'buy' ? 'active-tab' : 'inactive-tab'}
                onClick={() => setModal((m) => ({ ...m, mode: 'buy' }))}
              >매수</button>
              <button
                className={modal.mode === 'sell' ? 'active-tab' : 'inactive-tab'}
                style={modal.mode === 'sell' ? { background: 'var(--down)', color: '#fff' } : {}}
                onClick={() => setModal((m) => ({ ...m, mode: 'sell' }))}
              >매도</button>
            </div>

            <div className="card" style={{ background: 'var(--primary-subtle)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}>
              <div className="row">
                <div className="stock-cell">
                  <div className="logo-sm">{stock.companyName.slice(0, 2)}</div>
                  <div>
                    <div className="strong">{stock.companyName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{stock.ticker}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="strong" style={{ fontSize: 16 }}>{fmt_price(currentPrice)}</div>
                  <div style={{ color: priceColor, fontSize: 12, fontWeight: 600 }}>{fmt_rate(changeRate)}</div>
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

            <div className="card" style={{ background: 'var(--bg)', boxShadow: 'none', border: '1px solid var(--border)', marginBottom: 18, padding: '14px 16px' }}>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">예상 체결금액</span>
                <span className="strong">{totalOrderPrice.toLocaleString()}원</span>
              </div>
              <div className="row" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">보유 가용 자금</span>
                <span>{virtualCash.toLocaleString()}원</span>
              </div>
              <div className="row" style={{ fontSize: 13 }}>
                <span className="muted">{modal.mode === 'buy' ? '매수 후 잔여' : '매도 후 예수금'}</span>
                <span className="strong" style={{ color: 'var(--primary)' }}>
                  {(modal.mode === 'buy'
                    ? Math.max(0, virtualCash - totalOrderPrice)
                    : virtualCash + totalOrderPrice
                  ).toLocaleString()}원
                </span>
              </div>
              {modal.mode === 'sell' && (
                <div className="row" style={{ fontSize: 13, marginTop: 8 }}>
                  <span className="muted">보유 수량</span>
                  <span>{(currentHolding?.quantity ?? 0).toLocaleString()}주</span>
                </div>
              )}
            </div>

            <button
              className={`btn btn-lg ${modal.mode === 'buy' ? 'btn-up' : 'btn-down'}`}
              style={{ width: '100%' }}
              disabled={!canSubmitTrade}
              onClick={submit_trade}
            >
              {tradeLoading ? '주문 처리 중...' : modal.mode === 'buy' ? '매수하기' : '매도하기'}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
