import type { CommunityBoardType, CommunityComment, CommunityPost } from '../api/community'

type ApiObject = Record<string, unknown>

const as_object = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? (value as ApiObject) : {}

const pick_text = (obj: ApiObject, keys: string[], fallback = ''): string => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }
  return fallback
}

const pick_num = (obj: ApiObject, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value)
  }
  return undefined
}

export const get_array = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data
  const obj = as_object(data)
  const candidates = [obj.items, obj.data, obj.list, obj.content, obj.results]
  return (candidates.find(Array.isArray) as unknown[]) ?? []
}

export const normalize_community_post = (value: unknown): CommunityPost | null => {
  const obj = as_object(value)
  const postId = pick_num(obj, ['postId', 'id', 'post_id'])
  if (postId === undefined) return null

  const boardTypeRaw = pick_text(obj, ['boardType', 'board_type', 'board'], 'FREE').toUpperCase()
  const boardType: CommunityBoardType = boardTypeRaw === 'STOCK' ? 'STOCK' : 'FREE'

  return {
    postId,
    boardType,
    ticker: pick_text(obj, ['ticker', 'stockCode', 'stock_code']) || undefined,
    stockName: pick_text(obj, ['stockName', 'stock_name']) || undefined,
    title: pick_text(obj, ['title'], '(제목 없음)'),
    content: pick_text(obj, ['content', 'body']),
    authorId: pick_num(obj, ['authorId', 'author_id', 'userId', 'user_id']),
    authorNickname: pick_text(obj, ['authorNickname', 'nickname', 'authorName', 'author'], '익명'),
    commentCount: pick_num(obj, ['commentCount', 'comment_count']) ?? 0,
    createdAt: pick_text(obj, ['createdAt', 'created_at']),
    updatedAt: pick_text(obj, ['updatedAt', 'updated_at']) || undefined,
  }
}

export const normalize_community_comment = (value: unknown): CommunityComment | null => {
  const obj = as_object(value)
  const commentId = pick_num(obj, ['commentId', 'id', 'comment_id'])
  if (commentId === undefined) return null

  return {
    commentId,
    postId: pick_num(obj, ['postId', 'post_id']) ?? 0,
    authorId: pick_num(obj, ['authorId', 'author_id', 'userId', 'user_id']),
    authorNickname: pick_text(obj, ['authorNickname', 'nickname', 'authorName', 'author'], '익명'),
    content: pick_text(obj, ['content', 'body']),
    createdAt: pick_text(obj, ['createdAt', 'created_at']),
    updatedAt: pick_text(obj, ['updatedAt', 'updated_at']) || undefined,
  }
}

export const get_community_error_message = (error: unknown, fallback: string): string => {
  const obj = as_object(error)
  const response = as_object(obj.response)
  const data = as_object(response.data)
  const message = data.message
  if (Array.isArray(message)) return message.join('\n')
  if (typeof message === 'string') return message
  if (typeof obj.message === 'string') return obj.message
  return fallback
}

export const validate_post_title = (title: string): string | undefined => {
  const trimmed = title.trim()
  if (!trimmed) return '제목을 입력해주세요'
  if (trimmed.length > 100) return '제목은 100자 이내로 입력해주세요'
}

export const validate_post_content = (content: string): string | undefined => {
  const trimmed = content.trim()
  if (!trimmed) return '내용을 입력해주세요'
  if (trimmed.length > 5000) return '내용은 5000자 이내로 입력해주세요'
}

export const validate_stock_ticker = (boardType: CommunityBoardType, ticker: string): string | undefined => {
  if (boardType === 'STOCK' && !ticker.trim()) return '종목 코드를 입력해주세요'
}

export const validate_comment_content = (content: string): string | undefined => {
  const trimmed = content.trim()
  if (!trimmed) return '댓글 내용을 입력해주세요'
  if (trimmed.length > 1000) return '댓글은 1000자 이내로 입력해주세요'
}

export const format_community_date = (value?: string): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
