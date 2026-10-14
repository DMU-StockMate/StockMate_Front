import { Link } from 'react-router-dom'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { useLoginForm } from '../hooks/useLoginForm'

export default function LoginPage() {
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    errors,
    loading,
    googleLoading,
    googleButtonRef,
    handle_submit,
  } = useLoginForm()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/stockmate-logo.svg" alt="" aria-hidden="true" width={40} height={40} style={{ objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--t1)' }}>
            StockMate
          </span>
        </div>

        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>로그인</h1>
          <p className="muted">투자 학습을 이어가 보세요</p>
        </div>

        {errors.general && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: 'var(--up-light, #FEF2F2)', color: 'var(--up)', fontSize: 13,
            border: '1px solid var(--up-border, #FCA5A5)',
          }}>
            {errors.general}
          </div>
        )}

        <form className="auth-form" onSubmit={handle_submit} noValidate>
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

          <div ref={googleButtonRef} style={{ minHeight: 44, opacity: googleLoading ? 0.6 : 1 }} />
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
