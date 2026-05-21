import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { api_login } from '../../api/auth'
import type { UserProfile } from '../../api/auth'
import { api } from '../../api/axios'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { adminLogin, isAdminLoggedIn } = useAdminAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAdminLoggedIn) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAdminLoggedIn, navigate])

  if (isAdminLoggedIn) return null

  const handle_submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data: tokens } = await api_login({ email, password })
      // Temporarily use accessToken to verify role
      const prevToken = localStorage.getItem('accessToken')
      localStorage.setItem('accessToken', tokens.accessToken)
      const { data: profile } = await api.get<UserProfile>('/users/me')
      // Restore previous token
      if (prevToken) localStorage.setItem('accessToken', prevToken)
      else localStorage.removeItem('accessToken')

      if (profile.role !== 'ADMIN') {
        setError('관리자 계정만 접근할 수 있습니다.')
        return
      }
      adminLogin(
        { id: profile.user_id, name: profile.name, email: profile.email, role: profile.role },
        tokens.accessToken,
      )
      navigate('/admin/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '로그인에 실패했습니다.'
      setError(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 400, background: '#fff', borderRadius: 20,
        boxShadow: 'var(--shadow)', padding: '40px 36px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 28, margin: '0 auto 16px',
          }}>S</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>관리자 로그인</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>StockMate 관리자 콘솔</p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: '#FEF2F2', color: 'var(--up)', fontSize: 13,
            border: '1px solid #FCA5A5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--t1)' }}>
              이메일
            </label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-envelope" style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--t3)', fontSize: 15,
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                style={{
                  width: '100%', height: 44, padding: '0 14px 0 40px',
                  borderRadius: 10, border: '1.5px solid var(--border)',
                  fontSize: 14, color: 'var(--t1)', background: '#fff', outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--t1)' }}>
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-lock" style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--t3)', fontSize: 15,
              }} />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoComplete="current-password"
                style={{
                  width: '100%', height: 44, padding: '0 44px 0 40px',
                  borderRadius: 10, border: '1.5px solid var(--border)',
                  fontSize: 14, color: 'var(--t1)', background: '#fff', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 16,
                }}
              >
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 48, borderRadius: 12, background: 'var(--gradient)',
              color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-shield-lock'}`} />
            {loading ? '로그인 중...' : '관리자 로그인'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
          관리자 권한이 없는 계정은 접근할 수 없습니다.
        </p>
      </div>
    </div>
  )
}
