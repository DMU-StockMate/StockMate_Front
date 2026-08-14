import { api } from './axios'

export interface QuizChoice {
  choice_id?: number
  choiceId?: number
  id?: number
  choice_no?: number
  choiceNo?: number
  choice_text?: string
  text?: string
  is_correct?: boolean
  isCorrect?: boolean
}

export interface QuizQuestion {
  question_id?: number
  questionId?: number
  topic_id?: number
  topicId?: number
  category_id?: number | null
  categoryId?: number | null
  investment_level_id?: number | null
  investmentLevelId?: number | null
  category?: {
    category_id?: number
    categoryId?: number
    category_name?: string
    categoryName?: string
  } | null
  question_type?: string
  questionType?: string
  question_text?: string
  questionText?: string
  explanation?: string | null
  reward_cash?: number
  rewardCash?: number
  status?: string
  choices: QuizChoice[]
}

export interface QuizAttempt {
  attempt_id?: number
  attemptId?: number
  user_id?: number
  userId?: number
  question_id?: number
  questionId?: number
  selected_choice_id?: number
  selectedChoiceId?: number
  is_correct?: boolean
  isCorrect?: boolean
  reward_cash_earned?: number
  rewardCashEarned?: number
  solved_at?: string
  solvedAt?: string
  question?: QuizQuestion
}

export interface QuizBookmark {
  bookmark_id?: number
  bookmarkId?: number
  user_id?: number
  userId?: number
  question_id?: number
  questionId?: number
  created_at?: string
  createdAt?: string
  question?: QuizQuestion
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

export interface GetQuestionsParams {
  topicId?: number
  categoryId?: number
  investmentLevelId?: number
}

export interface LearningTopic {
  topicId: number
  categoryId?: number
  investmentLevelId?: number
  investment_level_id?: number
  topicName: string
  categoryName?: string
  description: string | null
}

export const api_get_questions = (params?: GetQuestionsParams) =>
  api.get<QuizQuestion[]>('/learning/questions', params ? { params } : undefined)

export const api_get_topics = () =>
  api.get<LearningTopic[]>('/learning/topics')

export const api_get_questions_by_topic = (topicId: number) =>
  api.get<QuizQuestion[]>('/learning/questions', { params: { categoryId: topicId } })

export const api_get_question = (questionId: number) =>
  api.get<QuizQuestion>(`/learning/questions/${questionId}`)

export const api_submit_answer = (questionId: number, selectedChoiceId: number) =>
  api.post<SubmitAnswerResponse>(`/learning/questions/${questionId}/submit`, { selectedChoiceId })

export const api_get_histories = () =>
  api.get<QuizAttempt[]>('/learning/histories')

export const api_get_statistics = () =>
  api.get<LearningStatistics>('/learning/statistics')

export const api_get_wrong_notes = () =>
  api.get<QuizAttempt[]>('/learning/wrong-notes')

export const api_get_wrong_note = (questionId: number) =>
  api.get<QuizAttempt>(`/learning/wrong-notes/${questionId}`)

export const api_delete_wrong_note = (questionId: number) =>
  api.delete(`/learning/wrong-notes/${questionId}`)

export interface ConceptTopic {
  topicId: number
  topicName: string
}

export interface ConceptInvestmentLevel {
  investmentLevelId: number
  levelName: string
}

export interface ConceptSummary {
  conceptId: number
  slug: string
  title: string
  summary: string | null
  learningObjectives: string[] | null
  estimatedMinutes: number
  sortOrder: number
  thumbnailUrl: string | null
  status: string
  topic: ConceptTopic | null
  investmentLevel: ConceptInvestmentLevel | null
}

export interface ConceptBlock {
  blockId: number
  blockType: string
  sortOrder: number
  title: string | null
  contentText: string | null
  contentJson: Record<string, unknown> | null
  styleVariant: string | null
}

export interface ConceptQuizChoice {
  id: number
  text: string
}

export interface ConceptQuiz {
  questionId: number
  questionText: string
  choices: ConceptQuizChoice[]
}

export interface ConceptDetail extends ConceptSummary {
  prerequisiteText: string | null
  blocks: ConceptBlock[]
  quiz: ConceptQuiz | null
}

export const api_get_concepts = (params?: { topicId?: number; investmentLevelId?: number }) =>
  api.get<ConceptSummary[]>('/learning/concepts', params ? { params } : undefined)

export const api_get_concept = (slug: string) =>
  api.get<ConceptDetail>(`/learning/concepts/${slug}`)

export const api_add_bookmark = (questionId: number) =>
  api.post(`/learning/bookmarks/${questionId}`)

export const api_get_bookmarks = () =>
  api.get<QuizBookmark[]>('/learning/bookmarks')

export const api_delete_bookmark = (questionId: number) =>
  api.delete(`/learning/bookmarks/${questionId}`)
