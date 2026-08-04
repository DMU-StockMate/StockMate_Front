import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { api_logout } from '../api/auth'
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
  }
}
