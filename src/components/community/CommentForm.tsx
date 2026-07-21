import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button'
import Textarea from '../common/Textarea'
import { validate_comment_content } from '../../utils/community'

interface CommentFormProps {
  isLoggedIn: boolean
  submitting: boolean
  onSubmit: (content: string) => Promise<void>
}

export default function CommentForm({ isLoggedIn, submitting, onSubmit }: CommentFormProps) {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | undefined>()

  if (!isLoggedIn) {
    return (
      <div className="muted" style={{ padding: '16px 0', fontSize: 13 }}>
        댓글을 작성하려면 <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>로그인</span>이 필요합니다.
      </div>
    )
  }

  const handle_submit = async () => {
    const validationError = validate_comment_content(content)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(undefined)
    await onSubmit(content.trim())
    setContent('')
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <Textarea
        placeholder="댓글을 입력해주세요"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        error={error}
        style={{ minHeight: 90 }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button size="sm" disabled={submitting} onClick={() => void handle_submit()}>댓글 등록</Button>
      </div>
    </div>
  )
}
