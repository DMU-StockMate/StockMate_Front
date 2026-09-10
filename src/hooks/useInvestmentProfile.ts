import { useState } from 'react'
import { RISK_PROFILE_QUESTIONS } from '../constants/riskProfile'
import { api_submit_investment_profile, type InvestmentProfileResult } from '../api/investmentProfile'
import { get_community_error_message } from '../utils/community'

export function useInvestmentProfile() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<InvestmentProfileResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handle_select = (questionCode: string, optionCode: string) => {
    setAnswers((prev) => ({ ...prev, [questionCode]: optionCode }))
  }

  const answeredCount = Object.keys(answers).length
  const isComplete = answeredCount === RISK_PROFILE_QUESTIONS.length

  const handle_submit = async () => {
    if (!isComplete) {
      setError('모든 문항에 답변해주세요.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api_submit_investment_profile(
        RISK_PROFILE_QUESTIONS.map((q) => ({ questionCode: q.code, optionCode: answers[q.code] })),
      )
      setResult(data)
    } catch (err) {
      setError(get_community_error_message(err, '진단 결과 제출에 실패했습니다. 다시 시도해주세요.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handle_reset = () => {
    setResult(null)
    setError('')
  }

  return {
    questions: RISK_PROFILE_QUESTIONS,
    answers,
    result,
    answeredCount,
    isComplete,
    submitting,
    error,
    handle_select,
    handle_submit,
    handle_reset,
  }
}
