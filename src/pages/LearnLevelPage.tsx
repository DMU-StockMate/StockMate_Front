import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/common/Card'
import Progress from '../components/common/Progress'
import Pill from '../components/common/Pill'
import { useState } from 'react'
import Chip, { ChipRow } from '../components/common/Chip'

interface TopicData {
  id: string
  icon: string
  title: string
  desc: string
  total: number
  done: number
  reward: number
  status: 'done' | 'active' | 'not-started' | 'locked'
  unlockCondition?: string
}

const LEVEL_META: Record<string, {
  badge: string
  badgeBg: string
  title: string
  sub: string
  topics: TopicData[]
  total: number
  done: number
  correctRate: number
  earned: number
}> = {
  beginner: {
    badge: '초', badgeBg: '#10B981',
    title: '초급 학습', sub: '투자 입문자를 위한 기초 과정 · 권장 Lv.1~3',
    total: 78, done: 50, correctRate: 82, earned: 25000,
    topics: [
      { id: 'basic-terms', icon: '📘', title: '기초 용어', desc: 'PER, EPS, ROE 등 투자에서 자주 쓰는 핵심 용어를 익힙니다.', total: 22, done: 12, reward: 11000, status: 'active' },
      { id: 'chart-basics', icon: '📈', title: '차트 기초', desc: '캔들, 이동평균선, 거래량 등 차트의 기본 구성 요소를 배웁니다.', total: 18, done: 7, reward: 5600, status: 'active' },
      { id: 'market-basics', icon: '🏛', title: '시장 이해', desc: '코스피·코스닥 구조, 거래시간, 시장 종류를 이해합니다.', total: 14, done: 14, reward: 7000, status: 'done' },
      { id: 'trading-basics', icon: '💰', title: '매매의 기본', desc: '호가, 주문 종류, 체결 방식 등 실전 매매에 필요한 기본기.', total: 12, done: 3, reward: 1500, status: 'active' },
      { id: 'risk-return', icon: '⚖️', title: '위험과 수익', desc: '리스크와 수익의 관계, 분산투자 원리를 이해합니다.', total: 10, done: 0, reward: 0, status: 'not-started' },
      { id: 'stock-analysis', icon: '🔍', title: '종목 분석 입문', desc: '기본적/기술적 분석의 차이와 활용법. (이전 주제 70% 완료 시 해제)', total: 16, done: 0, reward: 0, status: 'locked', unlockCondition: '앞 주제 70% 완료 시 해제' },
    ],
  },
  intermediate: {
    badge: '중', badgeBg: '#3B82F6',
    title: '중급 학습', sub: '핵심 지표 분석과 실전 투자 · 권장 Lv.4~7',
    total: 156, done: 19, correctRate: 71, earned: 9500,
    topics: [
      { id: 'financial-statements', icon: '📊', title: '재무제표 분석', desc: '손익계산서, 대차대조표, 현금흐름표 핵심 분석법.', total: 28, done: 10, reward: 8000, status: 'active' },
      { id: 'valuation', icon: '💎', title: '가치평가', desc: 'PER, PBR, EV/EBITDA 등을 활용한 적정 가치 산출.', total: 24, done: 5, reward: 4000, status: 'active' },
      { id: 'industry-analysis', icon: '🏭', title: '산업 분석', desc: '섹터별 특성과 경쟁구조, 산업 사이클 이해.', total: 20, done: 4, reward: 3200, status: 'active' },
      { id: 'technical-analysis', icon: '📉', title: '기술적 분석', desc: '추세선, 패턴, 보조지표를 활용한 매매 타이밍.', total: 32, done: 0, reward: 0, status: 'not-started' },
      { id: 'etf-fund', icon: '🗂', title: 'ETF & 펀드', desc: 'ETF 구조, 운용 방식, 배당과 수수료 비교.', total: 26, done: 0, reward: 0, status: 'not-started' },
      { id: 'macro', icon: '🌐', title: '거시경제 입문', desc: '금리, 환율, 인플레이션이 주식시장에 미치는 영향.', total: 26, done: 0, reward: 0, status: 'locked', unlockCondition: '중급 3개 주제 완료 시 해제' },
    ],
  },
  advanced: {
    badge: '고', badgeBg: '#6D29D9',
    title: '고급 학습', sub: '심화된 전략과 고급 분석 · 권장 Lv.8+',
    total: 230, done: 0, correctRate: 0, earned: 0,
    topics: [
      { id: 'macro-advanced', icon: '🌐', title: '거시경제 심화', desc: '중앙은행 정책, 글로벌 자금 흐름, 통화량 분석.', total: 40, done: 0, reward: 0, status: 'locked', unlockCondition: '중급 완료 시 해제' },
      { id: 'options', icon: '⚡', title: '옵션 & 파생상품', desc: '콜·풋 옵션의 원리와 헤지 전략.', total: 44, done: 0, reward: 0, status: 'locked', unlockCondition: '중급 완료 시 해제' },
      { id: 'portfolio', icon: '🎯', title: '포트폴리오 관리', desc: '자산배분, 리밸런싱, 샤프 비율 등 포트폴리오 최적화.', total: 38, done: 0, reward: 0, status: 'locked', unlockCondition: '중급 완료 시 해제' },
      { id: 'quant', icon: '🤖', title: '퀀트 전략', desc: '팩터 투자, 모멘텀 전략, 백테스트 기초.', total: 36, done: 0, reward: 0, status: 'locked', unlockCondition: '고급 Lv.1 이상' },
      { id: 'global-market', icon: '🗺', title: '글로벌 시장', desc: '미국 주식, 해외 ETF, 환헤지 방법.', total: 34, done: 0, reward: 0, status: 'locked', unlockCondition: '고급 Lv.1 이상' },
      { id: 'tax', icon: '📑', title: '세금과 제도', desc: '양도소득세, 금융투자소득세, 절세 전략.', total: 38, done: 0, reward: 0, status: 'locked', unlockCondition: '고급 Lv.2 이상' },
    ],
  },
  custom: {
    badge: 'AI', badgeBg: 'linear-gradient(135deg, #EC4899, #F59E0B)',
    title: '개인 맞춤 학습', sub: 'AI가 분석한 약점 보강 · 매일 갱신',
    total: 12, done: 3, correctRate: 67, earned: 1800,
    topics: [
      { id: 'weak-terms', icon: '🎯', title: '자주 틀린 용어', desc: 'PER, EV/EBITDA 등 최근 3회 이상 오답한 용어 집중 복습.', total: 5, done: 1, reward: 700, status: 'active' },
      { id: 'weak-chart', icon: '📉', title: '취약 차트 패턴', desc: '골든크로스/데드크로스 판별에서 오답률이 높아 추천합니다.', total: 4, done: 1, reward: 600, status: 'active' },
      { id: 'today-recommend', icon: '⭐', title: '오늘의 추천', desc: 'AI가 현재 시장 상황을 반영해 선별한 오늘의 학습 문제.', total: 3, done: 1, reward: 500, status: 'active' },
    ],
  },
}

type FilterType = '전체' | '진행 중' | '완료' | '미시작'

const statusLabel: Record<string, string> = {
  done: '완료', active: '진행 중', 'not-started': '미시작', locked: '잠금',
}

const pillVariantForStatus: Record<string, 'primary' | 'success' | 'gray' | 'warning'> = {
  done: 'success', active: 'primary', 'not-started': 'gray', locked: 'warning',
}

export default function LearnLevelPage() {
  const { section = 'beginner' } = useParams<{ section: string }>()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('전체')

  const meta = LEVEL_META[section] ?? LEVEL_META['beginner']

  const filtered = meta.topics.filter((t) => {
    if (filter === '전체') return true
    if (filter === '진행 중') return t.status === 'active'
    if (filter === '완료') return t.status === 'done'
    if (filter === '미시작') return t.status === 'not-started'
    return true
  })

  const progressPct = Math.round((meta.done / meta.total) * 100)

  const handle_topic_click = (topic: TopicData) => {
    if (topic.status === 'locked') return
    navigate(`/learn/${section}/${topic.id}`)
  }

  return (
    <AppLayout topbarPlaceholder="학습 검색">
      <div className="breadcrumb">
        <span className="bc-link" onClick={() => navigate('/learn')}>투자학습</span>
        <span className="bc-sep">›</span>
        <span className="bc-current">{meta.title}</span>
      </div>

      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className="lv-badge"
            style={{ width: 56, height: 56, borderRadius: 16, fontSize: 24, background: meta.badgeBg }}
          >
            {meta.badge}
          </div>
          <div>
            <h1>{meta.title}</h1>
            <div className="page-sub">{meta.sub}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: 12 }}>전체 진행률</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{progressPct}%</div>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { label: '총 문제', value: meta.total, color: '' },
            { label: '완료', value: meta.done, color: 'var(--success)' },
            { label: '정답률', value: `${meta.correctRate}%`, color: '' },
            { label: '획득 자금', value: `+${meta.earned.toLocaleString()}원`, color: 'var(--primary)' },
          ].map((s) => (
            <div key={s.label}>
              <div className="label">{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color || 'var(--t1)', marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <Progress value={progressPct} style={{ marginTop: 18 }} />
      </Card>

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>대주제 {meta.topics.length}개</div>
        <ChipRow>
          {(['전체', '진행 중', '완료', '미시작'] as FilterType[]).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </ChipRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {filtered.map((topic) => (
          <div
            key={topic.id}
            className={`topic-card ${topic.status === 'locked' ? 'locked' : ''}`}
            onClick={() => handle_topic_click(topic)}
          >
            <div className="row">
              <div className="topic-ico">{topic.icon}</div>
              <Pill variant={pillVariantForStatus[topic.status]}>
                {statusLabel[topic.status]}
              </Pill>
            </div>
            <div>
              <div className="topic-title">
                {topic.title} {topic.status === 'locked' ? '🔒' : ''}
              </div>
              <div className="topic-desc">{topic.desc}</div>
            </div>
            <Progress value={topic.done} max={topic.total} thin />
            <div className="topic-stats">
              <span><b>{topic.total}</b> 문제</span>
              {topic.unlockCondition ? (
                <span className="muted">{topic.unlockCondition}</span>
              ) : (
                <>
                  <span><b>{topic.done} / {topic.total}</b> 완료</span>
                  <span style={{ marginLeft: 'auto', color: topic.status === 'done' ? 'var(--success)' : 'var(--primary)' }}>
                    <b>+{topic.reward.toLocaleString()}원</b>
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
