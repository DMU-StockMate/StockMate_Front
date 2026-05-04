import AppLayout from '../components/layout/AppLayout'

export default function NewsPage() {
  return (
    <AppLayout topbarPlaceholder="뉴스 검색">
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t2)' }}>
        <i className="bi bi-newspaper" style={{ fontSize: 48, color: 'var(--primary)', display: 'block', marginBottom: 16 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>뉴스</div>
        <div style={{ fontSize: 14 }}>준비 중입니다.</div>
      </div>
    </AppLayout>
  )
}
