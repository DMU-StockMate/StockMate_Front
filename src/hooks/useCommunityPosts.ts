import { useCallback, useEffect, useState } from 'react'
import {
  api_delete_post,
  api_get_all_stock_posts,
  api_get_free_posts,
  api_get_stock_posts,
  type CommunityBoardType,
  type CommunityPost,
  type CommunitySortType,
} from '../api/community'
import { get_community_error_message } from '../utils/community'

const PAGE_SIZE = 20

const default_sort_for = (boardType: CommunityBoardType): CommunitySortType =>
  boardType === 'STOCK' ? 'likes' : 'latest'

export interface SelectedStock {
  ticker: string
  companyName: string
}

export function useCommunityPosts(initialBoardType: CommunityBoardType = 'FREE', initialStock: SelectedStock | null = null) {
  const [boardType, setBoardTypeState] = useState<CommunityBoardType>(initialBoardType)
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(initialStock)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sort, setSort] = useState<CommunitySortType>(default_sort_for(initialBoardType))
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionPostId, setActionPostId] = useState<number | null>(null)

  const setBoardType = (next: CommunityBoardType) => {
    setBoardTypeState(next)
    setSelectedStock(null)
    setSort(default_sort_for(next))
    setPage(1)
  }

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { keyword: searchKeyword || undefined, sort, page, limit: PAGE_SIZE }
      const { data } = boardType === 'FREE'
        ? await api_get_free_posts(params)
        : selectedStock
          ? await api_get_stock_posts(selectedStock.ticker, params)
          : await api_get_all_stock_posts(params)
      setPosts(data.items)
      setTotal(data.meta.total)
      setTotalPages(Math.max(1, data.meta.totalPages))
    } catch (err) {
      setError(get_community_error_message(err, '게시글을 불러오지 못했습니다.'))
      setPosts([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [boardType, selectedStock, searchKeyword, sort, page])

  useEffect(() => { void reload() }, [reload])

  const handle_select_stock = (stock: SelectedStock) => {
    setSelectedStock(stock)
    setPage(1)
  }

  const handle_clear_stock = () => {
    setSelectedStock(null)
    setPage(1)
  }

  const handle_search = () => {
    setSearchKeyword(keyword.trim())
    setPage(1)
  }

  const handle_sort_change = (next: CommunitySortType) => {
    setSort(next)
    setPage(1)
  }

  const remove = useCallback(async (postId: number) => {
    setActionPostId(postId)
    setError('')
    try {
      await api_delete_post(postId)
      await reload()
    } catch (err) {
      setError(get_community_error_message(err, '게시글 삭제에 실패했습니다.'))
      throw err
    } finally {
      setActionPostId(null)
    }
  }, [reload])

  return {
    actionPostId,
    boardType, setBoardType,
    error,
    handle_clear_stock,
    handle_search,
    handle_select_stock,
    handle_sort_change,
    keyword, setKeyword,
    loading,
    page, setPage,
    posts,
    remove,
    selectedStock,
    sort,
    total,
    totalPages,
  }
}
