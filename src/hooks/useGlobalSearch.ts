import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api_search_stocks, type Stock } from '../api/stocks'
import { api_get_free_posts } from '../api/community'
import { get_array as get_stock_array } from '../utils/normalize'
import { LEVEL_META } from './useLearnLevel'

export type SearchCategory = 'STOCK' | 'COMMUNITY' | 'LEARNING'

export interface SearchResultItem {
  id: string
  category: SearchCategory
  title: string
  subtitle: string
  path: string
}

const LEARNING_INDEX = Object.entries(LEVEL_META).flatMap(([section, meta]) =>
  meta.topics.map((topic) => ({ section, sectionTitle: meta.title, topicId: topic.id, title: topic.title, desc: topic.desc })),
)

const search_learning_topics = (keyword: string): SearchResultItem[] => {
  const q = keyword.trim().toLowerCase()
  if (!q) return []
  return LEARNING_INDEX
    .filter((topic) => topic.title.toLowerCase().includes(q) || topic.desc.toLowerCase().includes(q))
    .slice(0, 5)
    .map((topic) => ({
      id: `learning-${topic.section}-${topic.topicId}`,
      category: 'LEARNING' as const,
      title: topic.title,
      subtitle: topic.sectionTitle,
      path: `/learn/${topic.section}/${topic.topicId}`,
    }))
}

const DEBOUNCE_MS = 300

export function useGlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stockResults, setStockResults] = useState<SearchResultItem[]>([])
  const [communityResults, setCommunityResults] = useState<SearchResultItem[]>([])

  const learningResults = useMemo(() => search_learning_topics(query), [query])

  useEffect(() => {
    const keyword = query.trim()
    if (!keyword) {
      queueMicrotask(() => {
        setStockResults([])
        setCommunityResults([])
        setLoading(false)
      })
      return
    }

    let alive = true
    queueMicrotask(() => { if (alive) setLoading(true) })

    const timer = setTimeout(async () => {
      const [stocksRes, communityRes] = await Promise.allSettled([
        api_search_stocks({ keyword, limit: 5 }),
        api_get_free_posts({ keyword, limit: 5 }),
      ])
      if (!alive) return

      if (stocksRes.status === 'fulfilled') {
        const items = get_stock_array(stocksRes.value.data) as Stock[]
        setStockResults(items.slice(0, 5).map((stock) => ({
          id: `stock-${stock.ticker}`,
          category: 'STOCK' as const,
          title: stock.companyName,
          subtitle: [stock.ticker, stock.market].filter(Boolean).join(' · '),
          path: `/trade/stocks/${stock.ticker}`,
        })))
      } else {
        setStockResults([])
      }

      if (communityRes.status === 'fulfilled') {
        setCommunityResults(communityRes.value.data.items.slice(0, 5).map((post) => ({
          id: `community-${post.postId}`,
          category: 'COMMUNITY' as const,
          title: post.title,
          subtitle: '자유 게시판',
          path: `/community/${post.postId}`,
        })))
      } else {
        setCommunityResults([])
      }

      setLoading(false)
    }, DEBOUNCE_MS)

    return () => { alive = false; clearTimeout(timer) }
  }, [query])

  const results = useMemo(
    () => [...stockResults, ...communityResults, ...learningResults],
    [stockResults, communityResults, learningResults],
  )

  const open = focused && query.trim().length > 0

  const handle_select = useCallback((item: SearchResultItem) => {
    navigate(item.path)
    setQuery('')
    setFocused(false)
  }, [navigate])

  const handle_key_down = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results[0]) {
      handle_select(results[0])
    } else if (event.key === 'Escape') {
      setFocused(false)
    }
  }, [results, handle_select])

  return {
    query, setQuery,
    focused, setFocused,
    open,
    loading,
    stockResults, communityResults, learningResults,
    handle_select, handle_key_down,
  }
}
