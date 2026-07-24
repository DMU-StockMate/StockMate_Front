type ApiObject = Record<string, unknown>

const as_object = (value: unknown): ApiObject =>
  value && typeof value === 'object' ? (value as ApiObject) : {}

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
  if (trimmed.length > 255) return '제목은 255자 이내로 입력해주세요'
}

export const validate_post_content = (content: string): string | undefined => {
  const trimmed = content.trim()
  if (!trimmed) return '내용을 입력해주세요'
  if (trimmed.length > 10000) return '내용은 10000자 이내로 입력해주세요'
}

export const validate_comment_content = (content: string): string | undefined => {
  const trimmed = content.trim()
  if (!trimmed) return '댓글 내용을 입력해주세요'
  if (trimmed.length > 3000) return '댓글은 3000자 이내로 입력해주세요'
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
