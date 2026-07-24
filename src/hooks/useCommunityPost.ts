import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api_create_comment,
  api_delete_comment,
  api_delete_post,
  api_get_comments,
  api_get_post_detail,
  api_like_post,
  api_unlike_post,
  api_update_comment,
  type CommunityComment,
  type CommunityPost,
} from '../api/community'
import { get_community_error_message } from '../utils/community'

const COMMENTS_LIMIT = 50

export function useCommunityPost(postId: string | undefined) {
  const navigate = useNavigate()
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentError, setCommentError] = useState('')
  const [actionCommentId, setActionCommentId] = useState<number | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deletingPost, setDeletingPost] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likePending, setLikePending] = useState(false)

  const reload_post = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api_get_post_detail(postId)
      setPost(data)
    } catch (err) {
      setError(get_community_error_message(err, '게시글을 불러오지 못했습니다.'))
      setPost(null)
    } finally {
      setLoading(false)
    }
  }, [postId])

  const reload_comments = useCallback(async () => {
    if (!postId) return
    setCommentsLoading(true)
    setCommentError('')
    try {
      const { data } = await api_get_comments(postId, { limit: COMMENTS_LIMIT })
      setComments(data.items)
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글을 불러오지 못했습니다.'))
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    setLiked(false)
    void reload_post()
    void reload_comments()
  }, [reload_post, reload_comments])

  const remove_post = useCallback(async () => {
    if (!postId) return
    setDeletingPost(true)
    setError('')
    try {
      await api_delete_post(postId)
      navigate('/community', { replace: true })
    } catch (err) {
      setError(get_community_error_message(err, '게시글 삭제에 실패했습니다.'))
      throw err
    } finally {
      setDeletingPost(false)
    }
  }, [navigate, postId])

  const toggle_like = useCallback(async () => {
    if (!postId || likePending) return
    setLikePending(true)
    try {
      if (liked) {
        await api_unlike_post(postId)
        setLiked(false)
        setPost((prev) => (prev ? { ...prev, likeCount: Math.max(0, prev.likeCount - 1) } : prev))
      } else {
        await api_like_post(postId)
        setLiked(true)
        setPost((prev) => (prev ? { ...prev, likeCount: prev.likeCount + 1 } : prev))
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setLiked(true)
      } else {
        setError(get_community_error_message(err, '좋아요 처리에 실패했습니다.'))
      }
    } finally {
      setLikePending(false)
    }
  }, [postId, liked, likePending])

  const add_comment = useCallback(async (content: string) => {
    if (!postId) return
    setSubmittingComment(true)
    setCommentError('')
    try {
      await api_create_comment(postId, { content })
      await reload_comments()
      setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev))
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글 등록에 실패했습니다.'))
      throw err
    } finally {
      setSubmittingComment(false)
    }
  }, [postId, reload_comments])

  const edit_comment = useCallback(async (commentId: number, content: string) => {
    setActionCommentId(commentId)
    setCommentError('')
    try {
      await api_update_comment(commentId, { content })
      await reload_comments()
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글 수정에 실패했습니다.'))
      throw err
    } finally {
      setActionCommentId(null)
    }
  }, [reload_comments])

  const remove_comment = useCallback(async (commentId: number) => {
    setActionCommentId(commentId)
    setCommentError('')
    try {
      await api_delete_comment(commentId)
      setComments((prev) => prev.filter((comment) => comment.commentId !== commentId))
      setPost((prev) => (prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev))
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글 삭제에 실패했습니다.'))
      throw err
    } finally {
      setActionCommentId(null)
    }
  }, [])

  return {
    actionCommentId,
    add_comment,
    comments,
    commentError,
    commentsLoading,
    deletingPost,
    edit_comment,
    error,
    liked,
    likePending,
    loading,
    post,
    remove_comment,
    remove_post,
    submittingComment,
    toggle_like,
  }
}
