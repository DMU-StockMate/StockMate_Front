import { useCallback, useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { api_get_news_summaries, type NewsSummary } from '../api/news'

const quickKeywords = ['한국 주식', '증시', '반도체', '금리', '환율']

const format_date = (value: string | null) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function NewsPage() {
  const [keyword, setKeyword] = useState('한국 주식')
  const [input, setInput] = useState('한국 주식')
  const [news, setNews] = useState<NewsSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNews = useCallback(() => {
    setLoading(true)
    setError('')
    api_get_news_summaries({ keyword, limit: 12 })
      .then((res) => setNews(res.data))
      .catch(() => setError('뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'))
      .finally(() => setLoading(false))
  }, [keyword])

  useEffect(() => {
    loadNews()
    const timer = window.setInterval(loadNews, 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [loadNews])

  const submit = () => {
    const next = input.trim()
    if (next) setKeyword(next)
  }

  return (
    <AppLayout topbarPlaceholder="뉴스 검색">
      <div className="page-title">
        <div>
          <h1>뉴스 요약</h1>
          <div className="page-sub">최신 시장 뉴스를 짧게 읽고 흐름을 빠르게 확인하세요</div>
        </div>
        <div className="news-search">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="검색어"
          />
          <Button onClick={submit}>
            <i className="bi bi-search" />
            검색
          </Button>
        </div>
      </div>

      <div className="news-keywords">
        {quickKeywords.map((item) => (
          <button
            key={item}
            className={keyword === item ? 'active' : ''}
            onClick={() => {
              setInput(item)
              setKeyword(item)
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <div className="ranking-alert">
          <i className="bi bi-exclamation-circle" />
          {error}
        </div>
      )}

      <Card variant="hero" className="news-hero">
        <div className="label">현재 검색어</div>
        <div className="news-hero-title">{keyword}</div>
        <div className="news-hero-sub">
          {loading ? '최신 뉴스를 가져오는 중입니다.' : `${news.length.toLocaleString()}개 뉴스 요약`}
        </div>
      </Card>

      <div className="news-grid">
        {loading && (
          <Card><div className="ranking-empty">뉴스를 불러오는 중입니다.</div></Card>
        )}
        {!loading && news.length === 0 && (
          <Card><div className="ranking-empty">표시할 뉴스가 없습니다.</div></Card>
        )}
        {!loading && news.map((item) => (
          <Card key={item.url} className="news-card">
            <div className="news-card-head">
              <span className="news-source">{item.source || '뉴스'}</span>
              <span className="muted">{format_date(item.publishedAt)}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <a href={item.url} target="_blank" rel="noreferrer">
              원문 보기 <i className="bi bi-box-arrow-up-right" />
            </a>
          </Card>
        ))}
      </div>
    </AppLayout>
  )
}
