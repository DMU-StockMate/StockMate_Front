import { api } from './axios'

export interface InvestmentProfileAnswer {
  questionCode: string
  optionCode: string
}

export interface InvestmentProfileResult {
  riskProfile: {
    score: number
    type: string
  }
  learningProfile: {
    score: number
    recommendedLevelId: number
    recommendedLevel: 'beginner' | 'intermediate' | 'advanced'
  }
  diagnosedAt: string
  profileVersion: string
}

export const api_submit_investment_profile = (answers: InvestmentProfileAnswer[]) =>
  api.post<InvestmentProfileResult>('/users/investment-profile', { answers })

export const api_get_investment_profile = () =>
  api.get<InvestmentProfileResult>('/users/investment-profile')
