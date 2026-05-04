import AppLayout from '../components/layout/AppLayout'

export default function AIPage() {
  return (
    <AppLayout topbarPlaceholder="종목 검색">
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t2)' }}>
        <i className="bi bi-cpu" style={{ fontSize: 48, color: 'var(--primary)', display: 'block', marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>AI 분석</div>
        <div style={{ fontSize: 14 }}>준비 중입니다.</div>
      </div>
    </AppLayout>
  )
}
