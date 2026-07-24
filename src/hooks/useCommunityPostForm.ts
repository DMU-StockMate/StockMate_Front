import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api_create_free_post,
  api_create_stock_post,
  api_get_post_detail,
  api_update_post,
  type CommunityBoardType,
} from '../api/community'
import { get_community_error_message, validate_post_content, validate_post_title } from '../utils/community'

interface FormErrors {
  title?: string
  content?: string
  ticker?: string
  general?: string
}

export interface SelectedStock {
  ticker: string
  companyName: string
}

export function useCommunityPostForm(
  postId: string | undefined,
  defaultBoardType: CommunityBoardType = 'FREE',
  defaultStock: SelectedStock | null = null,
) {
  const navigate = useNavigate()
  const isEdit = Boolean(postId)

  const [boardType, setBoardType] = useState<CommunityBoardType>(defaultBoardType)
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(defaultStock)
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
        const { data: post } = await api_get_post_detail(postId)
        if (!alive) return
        setBoardType(post.boardType)
        if (post.stock) setSelectedStock({ ticker: post.stock.ticker, companyName: post.stock.companyName })
        setTitle(post.title)
        setContent(post.content ?? '')
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
      ticker: boardType === 'STOCK' && !isEdit && !selectedStock ? '종목을 선택해주세요' : undefined,
    }
    if (nextErrors.title || nextErrors.content || nextErrors.ticker) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      if (isEdit && postId) {
        await api_update_post(postId, { title: title.trim(), content: content.trim() })
        navigate(`/community/${postId}`, { replace: true })
        return
      }

      const { data: created } = boardType === 'STOCK' && selectedStock
        ? await api_create_stock_post(selectedStock.ticker, { title: title.trim(), content: content.trim() })
        : await api_create_free_post({ title: title.trim(), content: content.trim() })
      navigate(`/community/${created.postId}`)
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
    selectedStock, setSelectedStock,
    submitting,
    title, setTitle,
  }
}
