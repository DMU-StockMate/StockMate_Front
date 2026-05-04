import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

interface FormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

const INTEREST_OPTIONS = ['기초 주식', '재무제표', 'ETF', '기술적 분석', '가치투자', '성장주', '배당주']

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormValues>({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const set = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const toggleInterest = (item: string) =>
    setInterests((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))

  const validate = (): FormErrors => {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = '이름을 입력해주세요'
    if (!form.email) e.email = '이메일을 입력해주세요'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다'
    if (!form.password) e.password = '비밀번호를 입력해주세요'
    else if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다'
    if (!form.confirmPassword) e.confirmPassword = '비밀번호를 다시 입력해주세요'
    else if (form.password !== form.confirmPassword) e.confirmPassword = '비밀번호가 일치하지 않습니다'
    return e
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      // TODO: 실제 회원가입 API 호출로 교체
      await new Promise((r) => setTimeout(r, 600))
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = (() => {
    const pw = form.password
    if (!pw) return null
    if (pw.length < 8) return { label: '짧음', color: 'var(--up)', pct: 25 }
    if (pw.length >= 12 && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw))
      return { label: '강함', color: 'var(--success)', pct: 100 }
    if (/[A-Z]/.test(pw) && /\d/.test(pw)) return { label: '보통', color: 'var(--warning)', pct: 65 }
    return { label: '약함', color: 'var(--warning)', pct: 40 }
  })()

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            S
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--t1)' }}>
            StockMate
          </span>
        </div>

        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>회원가입</h1>
          <p className="muted">투자 학습을 시작해보세요</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="이름"
            type="text"
            placeholder="홍길동"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            leftIcon={<i className="bi bi-person" />}
            autoComplete="name"
          />

          <Input
            label="이메일"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            leftIcon={<i className="bi bi-envelope" />}
            autoComplete="email"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input
              label="비밀번호"
              type={showPw ? 'text' : 'password'}
              placeholder="8자 이상 입력"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              leftIcon={<i className="bi bi-lock" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--t3)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 16,
                  }}
                >
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              }
              autoComplete="new-password"
            />
            {passwordStrength && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: '#EFEBF6', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${passwordStrength.pct}%`,
                      height: '100%',
                      background: passwordStrength.color,
                      borderRadius: 999,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <Input
            label="비밀번호 확인"
            type={showPw ? 'text' : 'password'}
            placeholder="비밀번호 다시 입력"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            leftIcon={<i className="bi bi-lock-fill" />}
            autoComplete="new-password"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="input-label">관심 분야 (선택)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {INTEREST_OPTIONS.map((item) => (
                <span
                  key={item}
                  className={`chip ${interests.includes(item) ? 'active' : ''}`}
                  onClick={() => toggleInterest(item)}
                  style={{ height: 30, fontSize: 12 }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Button type="submit" block disabled={loading} style={{ marginTop: 4 }}>
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat" />
                가입 중...
              </>
            ) : (
              <>
                <i className="bi bi-person-check" />
                회원가입 완료
              </>
            )}
          </Button>

          <div className="divider">또는</div>

          <Button type="button" variant="outline" block>
            <i className="bi bi-google" />
            Google로 시작하기
          </Button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            로그인
          </Link>
        </p>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>
          가입 시{' '}
          <Link to="/terms" style={{ color: 'var(--t2)', textDecoration: 'underline' }}>이용약관</Link>
          {' '}및{' '}
          <Link to="/privacy" style={{ color: 'var(--t2)', textDecoration: 'underline' }}>개인정보처리방침</Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  )
}
