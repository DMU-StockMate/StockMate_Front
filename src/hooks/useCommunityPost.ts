import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api_create_community_comment,
  api_delete_community_comment,
  api_delete_community_post,
  api_get_community_comments,
  api_get_community_post,
  api_update_community_comment,
  type CommunityComment,
  type CommunityPost,
} from '../api/community'
import { get_array, get_community_error_message, normalize_community_comment, normalize_community_post } from '../utils/community'

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

  const reload_post = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api_get_community_post(postId)
      setPost(normalize_community_post(data))
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
      const { data } = await api_get_community_comments(postId)
      const items = get_array(data)
        .map(normalize_community_comment)
        .filter((comment): comment is CommunityComment => comment !== null)
      setComments(items)
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글을 불러오지 못했습니다.'))
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    void reload_post()
    void reload_comments()
  }, [reload_post, reload_comments])

  const remove_post = useCallback(async () => {
    if (!postId) return
    setDeletingPost(true)
    setError('')
    try {
      await api_delete_community_post(postId)
      navigate('/community', { replace: true })
    } catch (err) {
      setError(get_community_error_message(err, '게시글 삭제에 실패했습니다.'))
      throw err
    } finally {
      setDeletingPost(false)
    }
  }, [navigate, postId])

  const add_comment = useCallback(async (content: string) => {
    if (!postId) return
    setSubmittingComment(true)
    setCommentError('')
    try {
      await api_create_community_comment(postId, { content })
      await reload_comments()
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글 등록에 실패했습니다.'))
      throw err
    } finally {
      setSubmittingComment(false)
    }
  }, [postId, reload_comments])

  const edit_comment = useCallback(async (commentId: number, content: string) => {
    if (!postId) return
    setActionCommentId(commentId)
    setCommentError('')
    try {
      await api_update_community_comment(postId, commentId, { content })
      await reload_comments()
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글 수정에 실패했습니다.'))
      throw err
    } finally {
      setActionCommentId(null)
    }
  }, [postId, reload_comments])

  const remove_comment = useCallback(async (commentId: number) => {
    if (!postId) return
    setActionCommentId(commentId)
    setCommentError('')
    try {
      await api_delete_community_comment(postId, commentId)
      setComments((prev) => prev.filter((comment) => comment.commentId !== commentId))
    } catch (err) {
      setCommentError(get_community_error_message(err, '댓글 삭제에 실패했습니다.'))
      throw err
    } finally {
      setActionCommentId(null)
    }
  }, [postId])

  return {
    actionCommentId,
    add_comment,
    comments,
    commentError,
    commentsLoading,
    deletingPost,
    edit_comment,
    error,
    loading,
    post,
    remove_comment,
    remove_post,
    submittingComment,
  }
}
