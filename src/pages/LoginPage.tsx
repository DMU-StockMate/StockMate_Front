import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = '이메일을 입력해주세요'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식이 아닙니다'
    if (!password) e.password = '비밀번호를 입력해주세요'
    else if (password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다'
    return e
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      // TODO: 실제 로그인 API 호출로 교체
      await new Promise((r) => setTimeout(r, 600))
      login({ name: '세린', email, level: '초급 Lv.2' })
      navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div
            style={{
              width: 40, height: 40, borderRadius: 12, background: 'var(--gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 20,
            }}
          >S</div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--t1)' }}>
            StockMate
          </span>
        </div>

        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>로그인</h1>
          <p className="muted">투자 학습을 이어가 보세요</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="이메일"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<i className="bi bi-envelope" />}
            autoComplete="email"
          />

          <Input
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<i className="bi bi-lock" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex', alignItems: 'center', fontSize: 16 }}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            }
            autoComplete="current-password"
          />

          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <Button type="submit" block disabled={loading} style={{ marginTop: 4 }}>
            <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-box-arrow-in-right'}`} />
            {loading ? '로그인 중...' : '로그인'}
          </Button>

          <div className="divider">또는</div>

          <Button type="button" variant="outline" block>
            <i className="bi bi-google" />
            Google로 계속하기
          </Button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
          계정이 없으신가요?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
