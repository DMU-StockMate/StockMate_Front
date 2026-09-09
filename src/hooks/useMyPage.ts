import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { api_logout, api_withdraw } from '../api/auth'
import { api_get_statistics, api_get_histories, type LearningStatistics } from '../api/learning'
import { api_get_investment_profile, type InvestmentProfileResult } from '../api/investmentProfile'
import { RISK_TYPE_LABELS } from '../constants/riskProfile'
import { calc_streak_days } from '../utils/streak'

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

  useEffect(() => {
    api_get_statistics().then(({ data }) => setStats(data)).catch(() => {})
    api_get_histories().then(({ data }) => setStreakDays(calc_streak_days(data))).catch(() => {})
    api_get_investment_profile()
      .then(({ data }) => setInvestmentProfile(data))
      .catch(() => setInvestmentProfile(null))
  }, [])

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
      await api_withdraw(withdrawPassword)
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
    handle_open_withdraw,
    handle_close_withdraw,
    handle_withdraw,
  }
}
