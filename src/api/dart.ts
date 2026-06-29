import axios from 'axios'

const dart_api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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
