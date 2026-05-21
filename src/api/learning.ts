import { api } from './axios'

export interface QuizChoice {
  choice_id: number
  choice_no: number
  choice_text: string
  is_correct: boolean
}

export interface QuizQuestion {
  question_id: number
  topic_id: number
  investment_level_id: number | null
  question_type: string
  question_text: string
  explanation: string | null
  reward_cash: number
  status: string
  choices: QuizChoice[]
}

export interface SubmitAnswerResponse {
  message: string
  questionId: number
  selectedChoiceId: number
  correct: boolean
  reward: number
  explanation: string | null
}

export interface LearningStatistics {
  total: number
  correct: number
  wrong: number
  accuracy: number
}

export const api_get_questions = () =>
  api.get<QuizQuestion[]>('/learning/questions')

export const api_get_question = (questionId: number) =>
  api.get<QuizQuestion>(`/learning/questions/${questionId}`)

export const api_submit_answer = (questionId: number, selectedChoiceId: number) =>
  api.post<SubmitAnswerResponse>(`/learning/questions/${questionId}/submit`, { selectedChoiceId })

export const api_get_histories = () =>
  api.get('/learning/histories')

export const api_get_statistics = () =>
  api.get<LearningStatistics>('/learning/statistics')

export const api_get_wrong_notes = () =>
  api.get('/learning/wrong-notes')

export const api_delete_wrong_note = (questionId: number) =>
  api.delete(`/learning/wrong-notes/${questionId}`)

export const api_add_bookmark = (questionId: number) =>
  api.post(`/learning/bookmarks/${questionId}`)

export const api_get_bookmarks = () =>
  api.get('/learning/bookmarks')

export const api_delete_bookmark = (questionId: number) =>
  api.delete(`/learning/bookmarks/${questionId}`)
