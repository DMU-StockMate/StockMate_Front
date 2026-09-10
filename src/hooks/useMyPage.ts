import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { api_logout, api_withdraw } from '../api/auth'
import { api_get_statistics, api_get_histories, type LearningStatistics } from '../api/learning'
import { api_get_investment_profile, type InvestmentProfileResult } from '../api/investmentProfile'
import { RISK_TYPE_LABELS } from '../constants/riskProfile'
import { calc_streak_days } from '../utils/streak'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '407983056207-28p6ji7lqnmfri8uvu2sscuehstmgrja.apps.googleusercontent.com'

export function useMyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<LearningStatistics | null>(null)
  const [streakDays, setStreakDays] = useState(0)
  const [investmentProfile, setInvestmentProfile] = useState<InvestmentProfileResult | null>(null)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const googleWithdrawButtonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api_get_statistics().then(({ data }) => setStats(data)).catch(() => {})
    api_get_histories().then(({ data }) => setStreakDays(calc_streak_days(data))).catch(() => {})
    api_get_investment_profile()
      .then(({ data }) => setInvestmentProfile(data))
      .catch(() => setInvestmentProfile(null))
  }, [])

  useEffect(() => {
    if (!withdrawOpen || !googleWithdrawButtonRef.current) return

    const withdraw_with_google = async (googleIdToken: string) => {
      setWithdrawLoading(true)
      setWithdrawError('')
      try {
        await api_withdraw({ googleIdToken })
        setWithdrawOpen(false)
        logout()
        navigate('/login')
      } catch (err: any) {
        const msg = err?.response?.data?.message
        setWithdrawError(Array.isArray(msg) ? msg[0] : msg ?? '회원 탈퇴에 실패했습니다.')
      } finally {
        setWithdrawLoading(false)
      }
    }

    const render = () => {
      const google = (window as any).google
      if (!google?.accounts?.id || !googleWithdrawButtonRef.current) return
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response.credential) void withdraw_with_google(response.credential)
        },
      })
      google.accounts.id.renderButton(googleWithdrawButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleWithdrawButtonRef.current.offsetWidth,
        text: 'continue_with',
      })
    }

    if ((window as any).google?.accounts?.id) {
      render()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = render
    script.onerror = () => setWithdrawError('구글 인증 스크립트를 불러오지 못했습니다.')
    document.head.appendChild(script)
  }, [withdrawOpen, logout, navigate])

  const handle_logout = async () => {
    try {
      await api_logout()
    } catch {
      // 서버 에러와 관계없이 로컬 상태 정리
    }
    logout()
    navigate('/login')
  }

  const handle_retest_profile = () => navigate('/onboarding/investment-profile')

  const handle_open_withdraw = () => {
    setWithdrawPassword('')
    setWithdrawError('')
    setWithdrawOpen(true)
  }

  const handle_close_withdraw = () => {
    if (withdrawLoading) return
    setWithdrawOpen(false)
  }

  const handle_withdraw = async () => {
    if (!withdrawPassword) {
      setWithdrawError('비밀번호를 입력해주세요.')
      return
    }
    setWithdrawLoading(true)
    setWithdrawError('')
    try {
      await api_withdraw({ password: withdrawPassword })
      setWithdrawOpen(false)
      logout()
      navigate('/login')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setWithdrawError(Array.isArray(msg) ? msg[0] : msg ?? '회원 탈퇴에 실패했습니다.')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const riskTypeLabel = investmentProfile
    ? RISK_TYPE_LABELS[investmentProfile.riskProfile.type] ?? investmentProfile.riskProfile.type
    : null

  return {
    user,
    stats,
    streakDays,
    investmentProfile,
    riskTypeLabel,
    handle_logout,
    handle_retest_profile,
    withdrawOpen,
    withdrawPassword,
    setWithdrawPassword,
    withdrawError,
    withdrawLoading,
    googleWithdrawButtonRef,
    handle_open_withdraw,
    handle_close_withdraw,
    handle_withdraw,
  }
}
