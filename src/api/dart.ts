import axios from 'axios'
import { API_BASE_URL } from './axios'

const dart_api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000, // DART API는 corpCode.xml 3MB 다운로드가 포함되어 최대 2분
})

dart_api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface DartSyncIndicatorsResult {
  ticker: string
  corp: string
  businessYear: string
  tradeDate: string
  scale: number
  indicators: {
    eps: number | null
    bps: number | null
    roe: number | null
    per: number | null
    pbr: number | null
  }
}

export const api_sync_dart_indicators = (ticker: string, businessYear?: string) =>
  dart_api.post<DartSyncIndicatorsResult>(
    `/dart/stocks/${ticker}/sync-indicators`,
    null,
    { params: businessYear ? { businessYear } : undefined },
  )

export interface DartDisclosure {
  rceptNo: string
  title: string
  submitter: string
  receiptDate: string
  remark: string
  url: string
}

export const api_get_stock_disclosures = (ticker: string, count = 15) =>
  dart_api.get<DartDisclosure[]>(`/dart/stocks/${ticker}/disclosures`, { params: { count } })

export interface DartFinancialSummary {
  corpName: string
  businessYear: string
  reportName: string
  매출액: number | null
  영업이익: number | null
  당기순이익: number | null
  자산총계: number | null
  부채총계: number | null
  자본총계: number | null
}

export const api_get_stock_financial_summary = (ticker: string) =>
  dart_api.get<DartFinancialSummary>(`/dart/stocks/${ticker}/financial-summary`)
