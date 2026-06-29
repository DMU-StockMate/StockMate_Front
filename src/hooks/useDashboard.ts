import { useEffect, useMemo, useState } from 'react'
import { api_get_stock_prices } from '../api/stocks'
import { api_get_questions } from '../api/learning'
import { format_money, parse_number, useTradeHistory } from './useTradeHistory'
import { as_record, get_array } from '../utils/normalize'

const CHART_WIDTH = 1100
const CHART_HEIGHT = 200
const PERIOD_DAYS: Record<string, number> = { '1주': 7, '1개월': 30, '3개월': 90, '1년': 365 }

export const build_chart_points = (values: number[]) => {
  if (values.length === 0) return ''
  const plotValues = values.length === 1 ? [values[0], values[0]] : values
  const min = Math.min(...plotValues)
  const max = Math.max(...plotValues)
  const range = max - min || 1
  const topPadding = 18
  const bottomPadding = 24
  const drawableHeight = CHART_HEIGHT - topPadding - bottomPadding
  return plotValues.map((value, index) => {
    const x = plotValues.length === 1 ? CHART_WIDTH : (index / (plotValues.length - 1)) * CHART_WIDTH
    const y = topPadding + ((max - value) / range) * drawableHeight
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

const normalize_recommend_question = (raw: unknown) => {
  const item = as_record(raw)
  const id = Number(item.question_id ?? item.questionId ?? 0)
  const question = String(item.question_text ?? item.questionText ?? '')
  if (!id || !question) return null
  return {
    id,
    tag: String(item.topicName ?? item.topic ?? '투자 학습'),
    reward: Number(item.reward_cash ?? item.rewardCash ?? 0),
    question,
  }
}

export const CHART_WIDTH_CONST = CHART_WIDTH
export const CHART_HEIGHT_CONST = CHART_HEIGHT

export function useDashboard() {
  const [period, setPeriod] = useState('1개월')
  const [assetTrend, setAssetTrend] = useState<number[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [recommendQuestions, setRecommendQuestions] = useState<Array<{ id: number; tag: string; reward: number; question: string }>>([])
  const [recommendLoading, setRecommendLoading] = useState(false)
  const { holdings, summary, loading, error } = useTradeHistory()

  useEffect(() => {
    let canceled = false
    const load = async () => {
      if (holdings.length === 0) {
        setAssetTrend(summary.totalAsset > 0 ? [summary.totalAsset, summary.totalAsset] : [])
        return
      }
      setChartLoading(true)
      try {
        const days = PERIOD_DAYS[period] ?? 30
        const results = await Promise.allSettled(
          holdings.map((h) => api_get_stock_prices(h.ticker, { days, limit: days })),
        )
        const valuesByDate = new Map<string, number>()
        results.forEach((result, index) => {
          if (result.status !== 'fulfilled') return
          const quantity = holdings[index]?.quantity ?? 0
          result.value.data.prices?.forEach((price) => {
            const closePrice = parse_number(price.closePrice)
            if (!price.tradeDate || closePrice <= 0 || quantity <= 0) return
            valuesByDate.set(price.tradeDate, (valuesByDate.get(price.tradeDate) ?? summary.cashBalance) + closePrice * quantity)
          })
        })
        const nextTrend = Array.from(valuesByDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, v]) => v)
        if (!canceled) setAssetTrend(nextTrend.length > 0 ? nextTrend : [summary.totalAsset, summary.totalAsset])
      } catch {
        if (!canceled) setAssetTrend(summary.totalAsset > 0 ? [summary.totalAsset, summary.totalAsset] : [])
      } finally {
        if (!canceled) setChartLoading(false)
      }
    }
    void load()
    return () => { canceled = true }
  }, [holdings, period, summary.cashBalance, summary.totalAsset])

  useEffect(() => {
    let canceled = false
    const load = async () => {
      setRecommendLoading(true)
      try {
        const { data } = await api_get_questions()
        const next = get_array(data)
          .map(normalize_recommend_question)
          .filter((item): item is { id: number; tag: string; reward: number; question: string } => item !== null)
          .slice(0, 3)
        if (!canceled) setRecommendQuestions(next)
      } catch {
        if (!canceled) setRecommendQuestions([])
      } finally {
        if (!canceled) setRecommendLoading(false)
      }
    }
    void load()
    return () => { canceled = true }
  }, [])

  const chartPoints = useMemo(() => build_chart_points(assetTrend), [assetTrend])
  const chartFill = chartPoints ? `${chartPoints} ${CHART_WIDTH},${CHART_HEIGHT} 0,${CHART_HEIGHT}` : ''
  const lastChartPoint = chartPoints.split(' ').at(-1)?.split(',').map(Number) ?? [CHART_WIDTH, CHART_HEIGHT / 2]
  const topHoldings = holdings.slice(0, 5)

  return {
    period, setPeriod, assetTrend, chartLoading,
    recommendQuestions, recommendLoading,
    holdings, summary, loading, error, topHoldings,
    chartPoints, chartFill, lastChartPoint,
    format_money,
  }
}
