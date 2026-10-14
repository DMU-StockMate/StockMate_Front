import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  {
    icon: 'bi-journal-check',
    title: '단계별 투자학습',
    desc: '초급부터 고급까지 체계적인 커리큘럼. 퀴즈를 풀며 가상 자금을 모아보세요.',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    icon: 'bi-graph-up-arrow',
    title: '모의투자 시뮬레이션',
    desc: '실전과 동일한 환경에서 주식을 사고 팔며 투자 감각을 키워보세요.',
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
  },
  {
    icon: 'bi-cpu',
    title: 'AI 종목 분석',
    desc: 'AI가 종목의 재무 데이터와 차트를 분석해 인사이트를 제공합니다.',
    color: 'var(--accent)',
    bg: '#FCE7F3',
  },
  {
    icon: 'bi-trophy',
    title: '랭킹 & 커뮤니티',
    desc: '다른 투자자들과 수익률을 비교하고, 학습 경험을 공유해보세요.',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
]

const STEPS = [
  { num: '01', title: '회원가입', desc: '이메일로 무료 가입 후 관심 분야를 선택하세요.' },
  { num: '02', title: '수준 진단', desc: 'AI가 딱 맞는 학습 코스를 추천해드려요.' },
  { num: '03', title: '학습 & 투자', desc: '문제를 풀고 가상 자금으로 실전 투자를 경험하세요.' },
]

const STATS = [
  { value: '12,000+', label: '누적 회원' },
  { value: '500+', label: '학습 문제' },
  { value: '78%', label: '평균 정답률' },
  { value: '4.8', label: '앱 평점' },
]

export default function LandingPage() {
  const { isLoggedIn } = useAuth()

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* ── 헤더 네비게이션 ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: '0 32px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* 로고 */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/stockmate-logo.svg" alt="" aria-hidden="true" width={32} height={32} style={{ objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.3px' }}>
              StockMate
            </span>
          </Link>

          {/* 네비 */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {[
              { label: '서비스 소개', href: '#features' },
              { label: '이용 방법', href: '#how' },
              { label: '뉴스', href: '/news' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{ fontSize: 14, fontWeight: 500, color: 'var(--t2)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t2)')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
              <i className="bi bi-box-arrow-in-right" />
              로그인
            </Link>
            <Link to="/signup" className="btn btn-sm" style={{ textDecoration: 'none' }}>
              <i className="bi bi-person-plus" />
              회원가입
            </Link>
          </div>
        </div>
      </header>

      {/* ── 히어로 섹션 ── */}
      <section
        style={{
          background: 'var(--gradient)',
          padding: '100px 32px 80px',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: 'absolute', top: -80, right: -80,
            width: 320, height: 320,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -60, left: -60,
            width: 240, height: 240,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '50%',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.24)',
              borderRadius: 999, padding: '5px 14px',
              fontSize: 12, fontWeight: 600, marginBottom: 24,
            }}
          >
            <i className="bi bi-stars" />
            AI 기반 주식 투자 학습 플랫폼
          </div>

          <h1
            style={{
              fontSize: 52, fontWeight: 900, lineHeight: 1.18,
              letterSpacing: '-1px', marginBottom: 20, color: '#fff',
            }}
          >
            주식 투자,<br />지금 제대로 배워보세요
          </h1>

          <p style={{ fontSize: 18, opacity: 0.88, lineHeight: 1.7, marginBottom: 40 }}>
            단계별 학습부터 AI 분석, 모의투자까지<br />
            실전 투자 실력을 키울 수 있는 모든 것이 여기 있습니다
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/signup"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 52, padding: '0 28px', borderRadius: 12,
                background: '#fff', color: 'var(--primary)',
                fontWeight: 700, fontSize: 15, textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}
            >
              <i className="bi bi-person-plus-fill" />
              무료로 시작하기
            </Link>
            <a
              href="#features"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 52, padding: '0 28px', borderRadius: 12,
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none',
              }}
            >
              <i className="bi bi-play-circle" />
              서비스 살펴보기
            </a>
          </div>
        </div>
      </section>

      {/* ── 통계 배너 ── */}
      <section style={{ background: 'var(--primary-subtle)', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth: 1160, margin: '0 auto', padding: '28px 32px',
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0,
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center', padding: '16px 0',
                borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 핵심 기능 ── */}
      <section id="features" style={{ padding: '80px 32px', maxWidth: 1160, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div
            style={{
              display: 'inline-block', background: 'var(--primary-light)',
              color: 'var(--primary)', padding: '4px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, marginBottom: 14, letterSpacing: '0.3px',
            }}
          >
            핵심 기능
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--t1)' }}>
            투자 실력을 키우는 4가지 방법
          </h2>
          <p style={{ fontSize: 16, color: 'var(--t2)', marginTop: 12, lineHeight: 1.7 }}>
            StockMate와 함께라면 누구든지 투자를 시작할 수 있습니다
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24 }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 20, padding: 32,
                display: 'flex', gap: 20, alignItems: 'flex-start',
                boxShadow: 'var(--shadow)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
            >
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: f.bg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className={`bi ${f.icon}`} style={{ fontSize: 24, color: f.color }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 이용 방법 ── */}
      <section id="how" style={{ background: 'var(--bg)', padding: '80px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div
              style={{
                display: 'inline-block', background: 'var(--primary-light)',
                color: 'var(--primary)', padding: '4px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 700, marginBottom: 14,
              }}
            >
              이용 방법
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--t1)' }}>
              3단계로 시작하세요
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, position: 'relative' }}>
            {/* 연결선 */}
            <div
              style={{
                position: 'absolute', top: 36, left: '20%', right: '20%',
                height: 2, background: 'var(--border)', zIndex: 0,
              }}
            />
            {STEPS.map((s) => (
              <div key={s.num} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'var(--gradient)', margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(109,41,217,0.22)',
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.num}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 10 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA 섹션 ── */}
      <section
        style={{
          background: 'var(--gradient)', padding: '80px 32px',
          textAlign: 'center', color: '#fff',
        }}
      >
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff', marginBottom: 14 }}>
          지금 바로 시작해보세요
        </h2>
        <p style={{ fontSize: 16, opacity: 0.88, marginBottom: 36 }}>
          회원가입은 무료입니다. 지금 시작해서 투자 실력을 키워보세요.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link
            to="/signup"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 52, padding: '0 28px', borderRadius: 12,
              background: '#fff', color: 'var(--primary)',
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}
          >
            <i className="bi bi-person-plus-fill" />
            무료 회원가입
          </Link>
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 52, padding: '0 28px', borderRadius: 12,
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.28)',
              color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none',
            }}
          >
            <i className="bi bi-box-arrow-in-right" />
            로그인
          </Link>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer style={{ background: 'var(--t1)', padding: '40px 32px', color: 'rgba(255,255,255,0.5)' }}>
        <div
          style={{
            maxWidth: 1160, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/stockmate-logo.svg" alt="" aria-hidden="true" width={28} height={28} style={{ objectFit: 'contain', flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>StockMate</span>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            {['이용약관', '개인정보처리방침', '고객센터'].map((label) => (
              <a
                key={label}
                href="#"
                style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
              >
                {label}
              </a>
            ))}
          </div>

          <div style={{ fontSize: 12 }}>© 2025 StockMate. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
