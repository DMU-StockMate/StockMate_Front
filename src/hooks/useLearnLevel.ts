import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  api_get_histories,
  api_get_questions,
  api_get_statistics,
  type LearningStatistics,
  type QuizAttempt,
} from '../api/learning'
import { as_record, get_array } from '../utils/normalize'

interface BackendQuestionItem {
  id: number
  question: string
  type: string
  reward: number
  solved: boolean
}

interface TopicData {
  id: string
  icon: string
  title: string
  desc: string
  status: 'active' | 'not-started'
}

type FilterType = '전체' | '진행 중' | '미시작'

const LEVEL_META: Record<string, {
  badge: string; badgeBg: string; title: string; sub: string; topics: TopicData[]
}> = {
  beginner: {
    badge: '초', badgeBg: '#10B981', title: '초급 학습', sub: '투자 입문자를 위한 기초 과정',
    topics: [
      { id: 'basic-terms', icon: 'bi-book', title: '기초 용어', desc: 'PER, EPS, ROE 등 투자에서 자주 쓰는 핵심 용어를 익힙니다.', status: 'active' },
      { id: 'chart-basics', icon: 'bi-graph-up-arrow', title: '차트 기초', desc: '캔들, 이동평균선, 거래량 등 차트의 기본 구성 요소를 배웁니다.', status: 'active' },
      { id: 'market-basics', icon: 'bi-bank', title: '시장 이해', desc: '시장 구조, 거래시간, 시장 종류를 이해합니다.', status: 'not-started' },
      { id: 'trading-basics', icon: 'bi-cash-coin', title: '매매의 기본', desc: '호가, 주문 종류, 체결 방식 등 실전 매매에 필요한 기본기.', status: 'not-started' },
      { id: 'risk-return', icon: 'bi-sliders', title: '위험과 수익', desc: '리스크와 수익의 관계, 분산투자 원리를 이해합니다.', status: 'not-started' },
      { id: 'stock-analysis', icon: 'bi-search', title: '종목 분석 입문', desc: '기본적/기술적 분석의 차이와 활용법을 익힙니다.', status: 'not-started' },
    ],
  },
  intermediate: {
    badge: '중', badgeBg: '#3B82F6', title: '중급 학습', sub: '핵심 지표 분석과 실전 투자',
    topics: [
      { id: 'financial-statements', icon: 'bi-bar-chart-line', title: '재무제표 분석', desc: '손익계산서, 대차대조표, 현금흐름표 핵심 분석법.', status: 'active' },
      { id: 'valuation', icon: 'bi-gem', title: '가치평가', desc: 'PER, PBR, EV/EBITDA 등을 활용한 적정 가치 산출.', status: 'active' },
      { id: 'industry-analysis', icon: 'bi-building', title: '산업 분석', desc: '섹터별 특성과 경쟁구조, 산업 사이클 이해.', status: 'not-started' },
      { id: 'technical-analysis', icon: 'bi-graph-down-arrow', title: '기술적 분석', desc: '추세선, 패턴, 보조지표를 활용한 매매 타이밍.', status: 'not-started' },
      { id: 'etf-fund', icon: 'bi-folder2-open', title: 'ETF & 펀드', desc: 'ETF 구조, 운용 방식, 배당과 수수료 비교.', status: 'not-started' },
      { id: 'macro', icon: 'bi-globe2', title: '거시경제 입문', desc: '금리, 환율, 인플레이션이 시장에 미치는 영향.', status: 'not-started' },
    ],
  },
  advanced: {
    badge: '고', badgeBg: '#6D29D9', title: '고급 학습', sub: '심화된 전략과 고급 분석',
    topics: [
      { id: 'macro-advanced', icon: 'bi-globe2', title: '거시경제 심화', desc: '중앙은행 정책, 글로벌 자금 흐름, 통화량 분석.', status: 'active' },
      { id: 'options', icon: 'bi-lightning-charge', title: '옵션 & 파생상품', desc: '콜·풋 옵션의 원리와 헤지 전략.', status: 'not-started' },
      { id: 'portfolio', icon: 'bi-bullseye', title: '포트폴리오 관리', desc: '자산배분, 리밸런싱, 샤프 비율 등 포트폴리오 최적화.', status: 'not-started' },
      { id: 'quant', icon: 'bi-cpu', title: '퀀트 전략', desc: '팩터 투자, 모멘텀 전략, 백테스트 기초.', status: 'not-started' },
      { id: 'global-market', icon: 'bi-map', title: '글로벌 시장', desc: '해외 주식, 해외 ETF, 환헤지 방법.', status: 'not-started' },
      { id: 'tax', icon: 'bi-receipt', title: '세금과 제도', desc: '양도소득세와 절세 전략.', status: 'not-started' },
    ],
  },
}

const get_question_id = (raw: unknown) => {
  const item = as_record(raw)
  return Number(item.question_id ?? item.questionId ?? 0)
}

const get_attempt_question_id = (attempt: QuizAttempt) =>
  Number(attempt.question_id ?? attempt.questionId ?? attempt.question?.question_id ?? attempt.question?.questionId ?? 0)

const normalize_backend_question = (raw: unknown, solvedIds: Set<number>): BackendQuestionItem | null => {
  const item = as_record(raw)
  const id = get_question_id(item)
  const question = String(item.question_text ?? item.questionText ?? '')
  if (!id || !question) return null
  return {
    id,
    question,
    type: String(item.question_type ?? item.questionType ?? 'MULTIPLE_CHOICE'),
    reward: Number(item.reward_cash ?? item.rewardCash ?? 0),
    solved: solvedIds.has(id),
  }
}

export function useLearnLevel() {
  const { section = 'beginner' } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('전체')
  const [backendQuestions, setBackendQuestions] = useState<BackendQuestionItem[]>([])
  const [stats, setStats] = useState<LearningStatistics | null>(null)
  const [questionLoadError, setQuestionLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const meta = LEVEL_META[section] ?? LEVEL_META.beginner

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      setQuestionLoadError('')
      try {
        const [questionsRes, historiesRes, statsRes] = await Promise.allSettled([
          api_get_questions(),
          api_get_histories(),
          api_get_statistics(),
        ])
        if (questionsRes.status !== 'fulfilled') throw new Error('question load failed')

        const solvedIds = new Set(
          historiesRes.status === 'fulfilled'
            ? (get_array(historiesRes.value.data) as QuizAttempt[]).map(get_attempt_question_id).filter((id) => id > 0)
            : [],
        )

        const questions = get_array(questionsRes.value.data)
          .map((item) => normalize_backend_question(item, solvedIds))
          .filter((item): item is BackendQuestionItem => item !== null)
          .sort((a, b) => a.id - b.id)

        if (!alive) return
        setBackendQuestions(questions)
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      } catch {
        if (!alive) return
        setBackendQuestions([])
        setQuestionLoadError('문제 목록 API 연결에 실패했습니다. 로그인 상태와 백엔드 서버를 확인해주세요.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  const filteredTopics = meta.topics.filter((t) => {
    if (filter === '전체') return true
    if (filter === '진행 중') return t.status === 'active'
    if (filter === '미시작') return t.status === 'not-started'
    return true
  })

  const solvedCount = useMemo(() => backendQuestions.filter((q) => q.solved).length, [backendQuestions])
  const progressPct = Math.round((solvedCount / Math.max(backendQuestions.length, 1)) * 100)
  const earned = useMemo(
    () => backendQuestions.filter((q) => q.solved).reduce((sum, q) => sum + q.reward, 0),
    [backendQuestions],
  )

  const handle_topic_click = (topic: TopicData) => navigate(`/learn/${section}/${topic.id}`)
  const handle_question_click = (id: number) => navigate(`/learn/quiz/basic-terms/${id}`)

  return {
    section, meta, filter, setFilter,
    backendQuestions, filteredTopics,
    stats, questionLoadError, loading,
    solvedCount, progressPct, earned,
    handle_topic_click, handle_question_click,
  }
}
