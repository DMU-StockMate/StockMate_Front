import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import Chip, { ChipRow } from '../components/common/Chip'
import {
  api_get_question,
  api_submit_answer,
  api_add_bookmark,
  api_delete_bookmark,
  type QuizQuestion,
  type SubmitAnswerResponse,
} from '../api/learning'

interface LocalQuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  tag: string
  difficulty: string
  reward: number
  total: number
  explanation: { label: string; text: string }[]
}

const QUIZ_DB: Record<string, Record<string, LocalQuizQuestion>> = {
  'basic-terms': {
    '13': {
      question: 'EBITDA(Earnings Before Interest, Taxes, Depreciation, and Amortization)는\n다음 중 무엇을 의미합니까?',
      options: [
        '이자 비용을 차감한 순이익',
        '이자, 세금, 감가상각비 차감 전 영업이익',
        '현금흐름표상의 영업활동 현금흐름',
        '매출액에서 매출원가를 차감한 매출총이익',
      ],
      correctIndex: 1,
      tag: '기초 용어', difficulty: '보통', reward: 800, total: 22,
      explanation: [
        { label: '핵심', text: 'EBITDA는 영업이익에서 이자·세금·감가상각비를 더해 회사의 본질적인 현금 창출력을 가늠하는 지표입니다.' },
        { label: '예시', text: '영업이익 100억, 감가상각비 30억이면 EBITDA는 130억. 자본 비중이 큰 산업에서 회사 간 비교에 유용합니다.' },
        { label: '활용', text: 'EV/EBITDA 비율로 유사 기업과 가치를 비교하거나, 부채가 많은 회사의 실질 수익력을 가늠할 때 쓰입니다.' },
      ],
    },
    '1': {
      question: 'PER(Price-Earnings Ratio)이 의미하는 것은 무엇입니까?',
      options: [
        '주가를 주당순이익(EPS)으로 나눈 비율',
        '주가를 주당순자산(BPS)으로 나눈 비율',
        '영업이익을 매출액으로 나눈 비율',
        '당기순이익을 자기자본으로 나눈 비율',
      ],
      correctIndex: 0,
      tag: '기초 용어', difficulty: '쉬움', reward: 500, total: 22,
      explanation: [
        { label: '핵심', text: 'PER(주가수익비율)은 현재 주가가 주당순이익의 몇 배인지를 나타냅니다.' },
        { label: '예시', text: '주가 50,000원, EPS 5,000원이면 PER = 10배.' },
        { label: '주의', text: 'PER이 낮다고 무조건 저평가가 아닙니다.' },
      ],
    },
    '14': {
      question: '자본잠식이란 어떤 상태를 의미합니까?',
      options: [
        '기업의 부채가 자산을 초과한 상태',
        '누적 결손금이 자본금보다 커져 자기자본이 줄어든 상태',
        '매출 성장률이 마이너스인 상태',
        '현금흐름이 마이너스인 상태',
      ],
      correctIndex: 1,
      tag: '기초 용어', difficulty: '보통', reward: 800, total: 22,
      explanation: [
        { label: '핵심', text: '자본잠식은 기업의 누적 결손금이 자본금을 초과해 자기자본이 감소하는 현상입니다.' },
        { label: '예시', text: '자본금 100억인데 누적 결손금 120억이면 자기자본은 -20억으로 완전자본잠식 상태.' },
        { label: '활용', text: '재무제표에서 자기자본 항목을 확인하고, 자본잠식 기업은 투자 전 경영 정상화 계획을 반드시 확인하세요.' },
      ],
    },
  },
  'chart-basics': {
    '4': {
      question: '주가 차트에서 골든크로스(Golden Cross)가 발생했을 때 일반적으로 의미하는 것은?',
      options: [
        '단기 이동평균선이 장기 이동평균선 아래로 하향 돌파',
        '단기 이동평균선이 장기 이동평균선 위로 상향 돌파',
        '주가가 볼린저밴드 상단을 돌파',
        'RSI 지수가 70을 초과',
      ],
      correctIndex: 1,
      tag: '차트 기초', difficulty: '쉬움', reward: 500, total: 18,
      explanation: [
        { label: '핵심', text: '골든크로스는 단기 이동평균선이 장기 이동평균선을 아래에서 위로 돌파하는 현상입니다.' },
        { label: '반대', text: '데드크로스는 반대 현상으로 단기선이 장기선 아래로 내려갈 때 발생합니다.' },
        { label: '주의', text: '이동평균선은 후행 지표이므로 추가 확인 지표를 함께 분석해야 합니다.' },
      ],
    },
  },
}

const FALLBACK_QUIZ: LocalQuizQuestion = {
  question: '다음 중 올바른 설명을 고르세요.',
  options: ['보기 1', '보기 2', '보기 3', '보기 4'],
  correctIndex: 0,
  tag: '학습', difficulty: '보통', reward: 500, total: 10,
  explanation: [
    { label: '핵심', text: '이 문제에 대한 해설입니다.' },
  ],
}

export default function QuizPage() {
  const { topicId = 'basic-terms', questionId = '13' } = useParams<{ topicId: string; questionId: string }>()
  const navigate = useNavigate()

  const [apiQuestion, setApiQuestion] = useState<QuizQuestion | null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitAnswerResponse | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const qNum = parseInt(questionId, 10)

  useEffect(() => {
    if (isNaN(qNum)) return
    setApiLoading(true)
    setSelected(null)
    setSubmitted(false)
    setSubmitResult(null)
    api_get_question(qNum)
      .then(({ data }) => setApiQuestion(data))
      .catch(() => setApiQuestion(null))
      .finally(() => setApiLoading(false))
  }, [questionId])

  const localQuiz = QUIZ_DB[topicId]?.[questionId] ?? FALLBACK_QUIZ

  const isApiMode = apiQuestion !== null

  const questionText = isApiMode ? apiQuestion.question_text : localQuiz.question
  const options = isApiMode
    ? apiQuestion.choices.sort((a, b) => a.choice_no - b.choice_no).map((c) => c.choice_text)
    : localQuiz.options
  const reward = isApiMode ? apiQuestion.reward_cash : localQuiz.reward
  const total = localQuiz.total

  const progressPct = Math.round((qNum / total) * 100)

  const isCorrect = isApiMode
    ? submitResult?.correct ?? false
    : selected === localQuiz.correctIndex

  const handle_submit = async () => {
    if (selected === null) return
    if (isApiMode) {
      const choice = apiQuestion.choices.sort((a, b) => a.choice_no - b.choice_no)[selected]
      try {
        const { data } = await api_submit_answer(apiQuestion.question_id, choice.choice_id)
        setSubmitResult(data)
        setSubmitted(true)
      } catch {
        setSubmitted(true)
      }
    } else {
      setSubmitted(true)
    }
  }

  const handle_next = () => {
    const nextId = qNum + 1
    if (nextId <= total) {
      navigate(`/learn/quiz/${topicId}/${nextId}`)
    } else {
      navigate(`/learn/beginner/${topicId}`)
    }
  }

  const handle_bookmark = async () => {
    if (!isApiMode || bookmarkLoading) return
    setBookmarkLoading(true)
    try {
      if (bookmarked) {
        await api_delete_bookmark(apiQuestion.question_id)
        setBookmarked(false)
      } else {
        await api_add_bookmark(apiQuestion.question_id)
        setBookmarked(true)
      }
    } catch {
      // 이미 북마크된 경우 등 무시
    } finally {
      setBookmarkLoading(false)
    }
  }

  const explanationBlocks: { label: string; text: string }[] = (() => {
    if (isApiMode && submitted) {
      const text = submitResult?.explanation ?? apiQuestion?.explanation ?? ''
      return text ? [{ label: '해설', text }] : []
    }
    return submitted ? localQuiz.explanation : []
  })()

  if (apiLoading) {
    return (
      <AppLayout topbarPlaceholder="학습 검색">
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: 80, color: 'var(--t2)' }}>
          문제를 불러오는 중...
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="breadcrumb">
          <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
          <span className="bc-sep">›</span>
          <span className="bc-link" onClick={() => navigate('/learn/beginner')}>초급</span>
          <span className="bc-sep">›</span>
          <span className="bc-link" onClick={() => navigate(`/learn/beginner/${topicId}`)}>{localQuiz.tag}</span>
          <span className="bc-sep">›</span>
          <span className="bc-current">Q{questionId}</span>
        </div>

        <div className="row" style={{ marginBottom: 20 }}>
          <button
            onClick={() => navigate(`/learn/beginner/${topicId}`)}
            style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
          <div style={{ flex: 1, margin: '0 24px' }}>
            <div className="row" style={{ marginBottom: 8, fontSize: 13, color: 'var(--t2)' }}>
              <span>Q{questionId} / {total}</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} />
          </div>
          <button
            onClick={handle_bookmark}
            style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', cursor: isApiMode ? 'pointer' : 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bookmarkLoading ? 0.5 : 1 }}
          >
            <i className={`bi ${bookmarked ? 'bi-heart-fill' : 'bi-heart'}`} style={{ color: bookmarked ? 'var(--up)' : undefined }} />
          </button>
        </div>

        {submitted && (
          <div className={`result-banner ${isCorrect ? 'correct' : 'wrong'}`} style={{ marginBottom: 20 }}>
            <div className="icon-circle">{isCorrect ? '✓' : '✗'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {isCorrect ? '정답입니다!' : '오답입니다.'}
              </div>
              <div style={{ marginTop: 4 }}>
                {isCorrect
                  ? `+${(submitResult?.reward ?? reward).toLocaleString()}원 획득`
                  : '다음엔 해설을 참고해 다시 도전해보세요!'}
              </div>
            </div>
          </div>
        )}

        <Card className="card-lg">
          <ChipRow style={{ marginBottom: 20 }}>
            <Chip active>{localQuiz.tag}</Chip>
            <Chip>난이도 · {localQuiz.difficulty}</Chip>
            <span
              className="chip"
              style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'transparent' }}
            >
              +{reward.toLocaleString()}원
            </span>
          </ChipRow>

          <h2 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5, marginBottom: 28 }}>
            {questionText.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
          </h2>

          {options.map((opt, i) => {
            let cls = 'opt'
            if (submitted) {
              if (isApiMode) {
                const sortedChoices = apiQuestion!.choices.sort((a, b) => a.choice_no - b.choice_no)
                if (sortedChoices[i]?.is_correct) cls += ' correct'
                else if (i === selected) cls += ' wrong'
              } else {
                if (i === localQuiz.correctIndex) cls += ' correct'
                else if (i === selected) cls += ' wrong'
              }
            } else if (i === selected) {
              cls += ' selected'
            }
            return (
              <div
                key={i}
                className={cls}
                onClick={() => !submitted && setSelected(i)}
              >
                <div className="num">{i + 1}</div>
                {opt}
              </div>
            )
          })}

          {!submitted ? (
            <div className="row" style={{ marginTop: 24 }}>
              <Button variant="outline">건너뛰기</Button>
              <Button size="lg" style={{ minWidth: 200 }} onClick={handle_submit} disabled={selected === null}>
                제출하기
              </Button>
            </div>
          ) : (
            <>
              {explanationBlocks.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div className="row" style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pill">AI 해설</span>
                      <span className="muted" style={{ fontSize: 12 }}>Claude가 제공</span>
                    </div>
                  </div>
                  {explanationBlocks.map((block) => (
                    <div key={block.label} className="ai-block">
                      <span className="ai-tag">{block.label}</span>
                      <span style={{ fontSize: 14, lineHeight: 1.6 }}>{block.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="row" style={{ marginTop: 24 }}>
                <Button variant="outline" onClick={() => navigate(`/learn/beginner/${topicId}`)}>
                  대주제로 돌아가기
                </Button>
                <Button size="lg" style={{ minWidth: 200 }} onClick={handle_next}>
                  다음 문제 →
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
