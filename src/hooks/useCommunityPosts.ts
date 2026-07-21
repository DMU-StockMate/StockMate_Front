import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  api_delete_community_post,
  api_get_community_posts,
  type CommunityBoardType,
  type CommunityPost,
} from '../api/community'
import { get_array, get_community_error_message, normalize_community_post } from '../utils/community'

const PAGE_SIZE = 10

export function useCommunityPosts(initialBoardType: CommunityBoardType = 'STOCK') {
  const [boardType, setBoardType] = useState<CommunityBoardType>(initialBoardType)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionPostId, setActionPostId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api_get_community_posts({
        boardType,
        keyword: searchKeyword || undefined,
        page,
        size: PAGE_SIZE,
      })
      const items = get_array(data)
        .map(normalize_community_post)
        .filter((post): post is CommunityPost => post !== null)
      const totalCount = Array.isArray(data) ? items.length : (data as { total?: number })?.total ?? items.length
      setPosts(items)
      setTotal(totalCount)
    } catch (err) {
      setError(get_community_error_message(err, '게시글을 불러오지 못했습니다.'))
      setPosts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [boardType, page, searchKeyword])

  useEffect(() => { void reload() }, [reload])

  const handle_change_board = (next: CommunityBoardType) => {
    setBoardType(next)
    setPage(1)
  }

  const handle_search = () => {
    setSearchKeyword(keyword.trim())
    setPage(1)
  }

  const remove = useCallback(async (postId: number) => {
    setActionPostId(postId)
    setError('')
    try {
      await api_delete_community_post(postId)
      await reload()
    } catch (err) {
      setError(get_community_error_message(err, '게시글 삭제에 실패했습니다.'))
      throw err
    } finally {
      setActionPostId(null)
    }
  }, [reload])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total])

  return {
    actionPostId,
    boardType,
    error,
    handle_change_board,
    handle_search,
    keyword,
    loading,
    page,
    posts,
    reload,
    remove,
    setKeyword,
    setPage,
    total,
    totalPages,
  }
}
