import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api_create_community_post,
  api_get_community_post,
  api_update_community_post,
  type CommunityBoardType,
} from '../api/community'
import {
  get_community_error_message,
  normalize_community_post,
  validate_post_content,
  validate_post_title,
  validate_stock_ticker,
} from '../utils/community'

interface FormErrors {
  title?: string
  content?: string
  ticker?: string
  general?: string
}

export function useCommunityPostForm(postId: string | undefined, defaultBoardType: CommunityBoardType = 'FREE') {
  const navigate = useNavigate()
  const isEdit = Boolean(postId)

  const [boardType, setBoardType] = useState<CommunityBoardType>(defaultBoardType)
  const [ticker, setTicker] = useState('')
  const [stockName, setStockName] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!postId) return
    let alive = true
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api_get_community_post(postId)
        const post = normalize_community_post(data)
        if (!alive || !post) return
        setBoardType(post.boardType)
        setTicker(post.ticker ?? '')
        setStockName(post.stockName ?? '')
        setTitle(post.title)
        setContent(post.content)
      } catch (err) {
        if (alive) setErrors({ general: get_community_error_message(err, '게시글을 불러오지 못했습니다.') })
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [postId])

  const handle_submit = async () => {
    const nextErrors: FormErrors = {
      title: validate_post_title(title),
      content: validate_post_content(content),
      ticker: validate_stock_ticker(boardType, ticker),
    }
    if (nextErrors.title || nextErrors.content || nextErrors.ticker) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      if (isEdit && postId) {
        await api_update_community_post(postId, {
          title: title.trim(),
          content: content.trim(),
          ticker: boardType === 'STOCK' ? ticker.trim() : undefined,
          stockName: boardType === 'STOCK' ? stockName.trim() : undefined,
        })
        navigate(`/community/${postId}`, { replace: true })
        return
      }

      const { data } = await api_create_community_post({
        boardType,
        title: title.trim(),
        content: content.trim(),
        ticker: boardType === 'STOCK' ? ticker.trim() : undefined,
        stockName: boardType === 'STOCK' ? stockName.trim() : undefined,
      })
      const created = normalize_community_post(data)
      navigate(created ? `/community/${created.postId}` : '/community')
    } catch (err) {
      setErrors({ general: get_community_error_message(err, '게시글 저장에 실패했습니다.') })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    boardType, setBoardType,
    content, setContent,
    errors,
    handle_submit,
    isEdit,
    loading,
    stockName, setStockName,
    submitting,
    ticker, setTicker,
    title, setTitle,
  }
}
