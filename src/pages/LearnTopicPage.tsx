import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Progress from '../components/common/Progress'
import Pill from '../components/common/Pill'
import Chip, { ChipRow } from '../components/common/Chip'

interface QuizItem {
  id: number
  question: string
  difficulty: '쉬움' | '보통' | '어려움'
  reward: number
  status: 'done' | 'current' | 'available' | 'locked'
}

const TOPIC_DATA: Record<string, {
  icon: string
  title: string
  sectionLabel: string
  totalDone: number
  totalItems: number
  correctCount: number
  wrongCount: number
  earned: number
  quizzes: QuizItem[]
}> = {
  'basic-terms': {
    icon: '📘', title: '기초 용어', sectionLabel: '초급 학습',
    totalDone: 12, totalItems: 22, correctCount: 10, wrongCount: 2, earned: 11000,
    quizzes: [
      { id: 1, question: 'PER이 의미하는 것은?', difficulty: '쉬움', reward: 500, status: 'done' },
      { id: 2, question: 'EPS의 정확한 정의는?', difficulty: '쉬움', reward: 500, status: 'done' },
      { id: 3, question: 'PBR과 PER의 차이는?', difficulty: '보통', reward: 800, status: 'done' },
      { id: 4, question: 'ROE가 의미하는 수익성은?', difficulty: '보통', reward: 800, status: 'done' },
      { id: 5, question: '시가총액 계산 방법은?', difficulty: '쉬움', reward: 500, status: 'done' },
      { id: 6, question: '거래량 vs 거래대금 차이?', difficulty: '쉬움', reward: 500, status: 'done' },
      { id: 7, question: '배당수익률이란?', difficulty: '보통', reward: 800, status: 'done' },
      { id: 8, question: '유상증자와 무상증자 차이?', difficulty: '보통', reward: 800, status: 'done' },
      { id: 9, question: '자기자본의 정의는?', difficulty: '쉬움', reward: 500, status: 'done' },
      { id: 10, question: '부채비율의 의미?', difficulty: '보통', reward: 800, status: 'done' },
      { id: 11, question: '유동성이란 무엇인가?', difficulty: '쉬움', reward: 500, status: 'done' },
      { id: 12, question: '시가/종가/고가/저가?', difficulty: '쉬움', reward: 500, status: 'done' },
      { id: 13, question: 'EBITDA는 어떻게 계산하나요?', difficulty: '보통', reward: 800, status: 'current' },
      { id: 14, question: '자본잠식이 의미하는 것?', difficulty: '보통', reward: 800, status: 'available' },
      { id: 15, question: '호가창 보는 방법은?', difficulty: '보통', reward: 800, status: 'available' },
      { id: 16, question: '단주거래란?', difficulty: '쉬움', reward: 500, status: 'available' },
      { id: 17, question: '우선주와 보통주 차이?', difficulty: '보통', reward: 800, status: 'available' },
      { id: 18, question: 'VI(변동성 완화장치)?', difficulty: '어려움', reward: 1200, status: 'available' },
      { id: 19, question: '공매도의 원리는?', difficulty: '어려움', reward: 1200, status: 'locked' },
      { id: 20, question: '신용거래 vs 미수거래?', difficulty: '어려움', reward: 1200, status: 'locked' },
      { id: 21, question: '배당락일이란?', difficulty: '보통', reward: 800, status: 'locked' },
      { id: 22, question: '시장조성자 제도는?', difficulty: '어려움', reward: 1200, status: 'locked' },
    ],
  },
  'chart-basics': {
    icon: '📈', title: '차트 기초', sectionLabel: '초급 학습',
    totalDone: 7, totalItems: 18, correctCount: 6, wrongCount: 1, earned: 5600,
    quizzes: Array.from({ length: 18 }, (_, i) => ({
      id: i + 1,
      question: ['캔들 차트란?', '양봉과 음봉의 차이?', '이동평균선이란?', '골든크로스 의미는?', '데드크로스 의미는?', '거래량 분석법?', '지지선과 저항선?', '볼린저밴드란?', 'RSI 지표 활용법?', 'MACD 설명', '스토캐스틱 지표?', '캔들 패턴의 종류', '갭 상승/하락이란?', '주가 추세 분석', '수렴과 발산 패턴', '피보나치 되돌림?', '엘리엇 파동이론', '일목균형표란?'][i],
      difficulty: (i < 6 ? '쉬움' : i < 12 ? '보통' : '어려움') as '쉬움' | '보통' | '어려움',
      reward: i < 6 ? 500 : i < 12 ? 800 : 1200,
      status: (i < 7 ? 'done' : i === 7 ? 'current' : i < 14 ? 'available' : 'locked') as QuizItem['status'],
    })),
  },
}

const FALLBACK_TOPIC = {
  icon: '📖', title: '학습 콘텐츠', sectionLabel: '초급 학습',
  totalDone: 0, totalItems: 10, correctCount: 0, wrongCount: 0, earned: 0,
  quizzes: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1, question: `문제 ${i + 1}`, difficulty: '보통' as const, reward: 800,
    status: (i === 0 ? 'current' : 'available') as QuizItem['status'],
  })),
}

type FilterType = '전체' | '미완료' | '완료' | '오답' | '찜'

export default function LearnTopicPage() {
  const { section = 'beginner', topic = 'basic-terms' } = useParams<{ section: string; topic: string }>()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('전체')

  const data = TOPIC_DATA[topic] ?? FALLBACK_TOPIC

  const filtered = data.quizzes.filter((q) => {
    if (filter === '전체') return true
    if (filter === '미완료') return q.status !== 'done'
    if (filter === '완료') return q.status === 'done'
    return true
  })

  const progressPct = Math.round((data.totalDone / data.totalItems) * 100)

  const handle_quiz_click = (quiz: QuizItem) => {
    if (quiz.status === 'locked') return
    navigate(`/learn/quiz/${topic}/${quiz.id}`)
  }

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-link" onClick={() => navigate(`/learn/${section}`)}>{data.sectionLabel}</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{data.title}</span>
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="topic-ico" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 28 }}>
            {data.icon}
          </div>
          <div>
            <h1>{data.title}</h1>
            <div className="page-sub">{data.sectionLabel} · {data.totalItems}문제 · 정답 시 평균 +500원</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline">한 번에 풀기</Button>
          <Button onClick={() => {
            const nextQ = data.quizzes.find((q) => q.status === 'current' || q.status === 'available')
            if (nextQ) navigate(`/learn/quiz/${topic}/${nextQ.id}`)
          }}>
            이어서 풀기 →
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 20, background: 'var(--gradient-soft)', borderColor: '#D8CDF0' }}>
        <div className="row">
          <div>
            <div className="strong" style={{ fontSize: 15 }}>
              {data.totalDone} / {data.totalItems} 문제 풀이 완료
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              정답 {data.correctCount} · 오답 {data.wrongCount} · 정답률 {data.totalDone > 0 ? Math.round((data.correctCount / data.totalDone) * 100) : 0}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 12 }}>획득 자금</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
              +{data.earned.toLocaleString()}원
            </div>
          </div>
        </div>
        <Progress value={progressPct} style={{ marginTop: 14 }} />
      </Card>

      <div className="row" style={{ marginBottom: 16 }}>
        <ChipRow>
          {(['전체', '미완료', '완료', '오답', '찜'] as FilterType[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </ChipRow>
        <span className="muted" style={{ fontSize: 12 }}>난이도 ▾</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {filtered.map((quiz) => (
          <div
            key={quiz.id}
            className={`quiz-mini ${quiz.status === 'done' ? 'done' : ''} ${quiz.status === 'current' ? 'current' : ''} ${quiz.status === 'locked' ? 'locked' : ''}`}
            onClick={() => handle_quiz_click(quiz)}
          >
            <div className="qm-num" style={quiz.status === 'current' ? { color: 'var(--accent)' } : {}}>
              Q{quiz.id}{quiz.status === 'current' ? ' · 다음 문제' : ''}
            </div>
            <div className="qm-q">{quiz.question}</div>
            <div className="qm-foot">
              <span>{quiz.difficulty}</span>
              <Pill variant={quiz.status === 'done' ? 'success' : 'primary'}>
                +{quiz.reward.toLocaleString()}원
              </Pill>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
