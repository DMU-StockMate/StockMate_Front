import { Link } from 'react-router-dom'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { useSignupForm } from '../hooks/useSignupForm'

const INTEREST_OPTIONS = ['기초 주식', '재무제표', 'ETF', '기술적 분석', '가치투자', '성장주', '배당주']

export default function SignupPage() {
  const {
    form,
    showPw, setShowPw,
    errors,
    interests,
    loading,
    passwordStrength,
    emailCodeSent,
    emailVerified,
    emailCode,
    setEmailCode,
    emailTimer,
    sendCodeLoading,
    verifyCodeLoading,
    handle_field,
    handle_toggle_interest,
    handle_send_code,
    handle_verify_code,
    format_timer,
    handle_submit,
  } = useSignupForm()

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>회원가입</h1>
          <p className="muted">투자 학습을 시작해보세요</p>
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
            label="이름"
            type="text"
            placeholder="홍길동"
            value={form.name}
            onChange={handle_field('name')}
            error={errors.name}
            leftIcon={<i className="bi bi-person" />}
            autoComplete="name"
          />

          <Input
            label="닉네임"
            type="text"
            placeholder="2~20자, 한글/영문/숫자"
            value={form.nickname}
            onChange={handle_field('nickname')}
            error={errors.nickname}
            leftIcon={<i className="bi bi-at" />}
            autoComplete="username"
          />

          {/* 이메일 + 인증코드 발송 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="이메일"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handle_field('email')}
                  error={errors.email}
                  leftIcon={
                    emailVerified
                      ? <i className="bi bi-check-circle-fill" style={{ color: 'var(--success)' }} />
                      : <i className="bi bi-envelope" />
                  }
                  autoComplete="email"
                  disabled={emailVerified}
                />
              </div>
              <button
                type="button"
                onClick={handle_send_code}
                disabled={sendCodeLoading || emailVerified}
                style={{
                  height: 44, marginBottom: errors.email ? 22 : 0, padding: '0 14px', borderRadius: 10, whiteSpace: 'nowrap',
                  border: '1.5px solid var(--border)', background: emailVerified ? 'var(--primary-light)' : '#fff',
                  color: emailVerified ? 'var(--primary)' : 'var(--t1)', fontWeight: 600, fontSize: 13,
                  cursor: emailVerified || sendCodeLoading ? 'not-allowed' : 'pointer',
                  opacity: emailVerified ? 0.7 : 1, flexShrink: 0,
                }}
              >
                {sendCodeLoading ? '발송 중...' : emailVerified ? '인증 완료' : emailCodeSent ? '재발송' : '인증코드 발송'}
              </button>
            </div>

            {emailCodeSent && !emailVerified && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Input
                    label="인증코드"
                    type="text"
                    placeholder="6자리 인증코드 입력"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    error={errors.emailCode}
                    leftIcon={<i className="bi bi-shield-lock" />}
                    maxLength={6}
                  />
                  {emailTimer > 0 && (
                    <span style={{
                      position: 'absolute', right: 12, top: 34,
                      fontSize: 12, color: emailTimer < 60 ? 'var(--up)' : 'var(--t3)',
                      fontWeight: 600,
                    }}>
                      {format_timer(emailTimer)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handle_verify_code}
                  disabled={verifyCodeLoading || !emailCode.trim()}
                  style={{
                    height: 44, marginBottom: errors.emailCode ? 22 : 0, padding: '0 14px', borderRadius: 10, whiteSpace: 'nowrap',
                    border: 'none', background: 'var(--primary)', color: '#fff',
                    fontWeight: 600, fontSize: 13,
                    cursor: verifyCodeLoading || !emailCode.trim() ? 'not-allowed' : 'pointer',
                    opacity: verifyCodeLoading || !emailCode.trim() ? 0.6 : 1, flexShrink: 0,
                  }}
                >
                  {verifyCodeLoading ? '확인 중...' : '확인'}
                </button>
              </div>
            )}
          </div>

          <Input
            label="전화번호"
            type="tel"
            placeholder="010-1234-5678"
            value={form.phone}
            onChange={handle_field('phone')}
            error={errors.phone}
            leftIcon={<i className="bi bi-phone" />}
            autoComplete="tel"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Input
              label="비밀번호"
              type={showPw ? 'text' : 'password'}
              placeholder="8자 이상 입력"
              value={form.password}
              onChange={handle_field('password')}
              error={errors.password}
              leftIcon={<i className="bi bi-lock" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--t3)', padding: 0,
                    display: 'flex', alignItems: 'center', fontSize: 16,
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
                      width: `${passwordStrength.pct}%`, height: '100%',
                      background: passwordStrength.color, borderRadius: 999,
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
            onChange={handle_field('confirmPassword')}
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
                  onClick={() => handle_toggle_interest(item)}
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
