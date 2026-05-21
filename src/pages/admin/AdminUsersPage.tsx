import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import {
  api_admin_get_users,
  api_admin_update_role,
  api_admin_update_status,
  type AdminUser,
} from '../../api/admin'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '활성', color: 'var(--success)' },
  INACTIVE: { label: '비활성', color: 'var(--t3)' },
  BANNED: { label: '정지', color: 'var(--up)' },
  DELETED: { label: '탈퇴', color: 'var(--t3)' },
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  USER: { label: '일반', color: 'var(--t2)' },
  ADMIN: { label: '관리자', color: 'var(--primary)' },
}

interface EditModal {
  open: boolean
  user: AdminUser | null
  type: 'role' | 'status'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<EditModal>({ open: false, user: null, type: 'role' })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    api_admin_get_users()
      .then(({ data }) => setUsers(data))
      .catch(() => setError('회원 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) =>
    !search.trim() ||
    u.name.includes(search) ||
    u.email.includes(search) ||
    u.nickname.includes(search)
  )

  const handle_open_role = (user: AdminUser) =>
    setModal({ open: true, user, type: 'role' })

  const handle_open_status = (user: AdminUser) =>
    setModal({ open: true, user, type: 'status' })

  const handle_close = () => {
    setModal({ open: false, user: null, type: 'role' })
    setActionMsg('')
  }

  const handle_update_role = async (role: 'USER' | 'ADMIN') => {
    if (!modal.user) return
    setActionLoading(true)
    try {
      const { data } = await api_admin_update_role(modal.user.user_id, role)
      setUsers((prev) => prev.map((u) => (u.user_id === data.user_id ? data : u)))
      handle_close()
    } catch (err: any) {
      setActionMsg(err?.response?.data?.message ?? '변경에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const handle_update_status = async (status: AdminUser['status']) => {
    if (!modal.user) return
    setActionLoading(true)
    try {
      const { data } = await api_admin_update_status(modal.user.user_id, status)
      setUsers((prev) => prev.map((u) => (u.user_id === data.user_id ? data : u)))
      handle_close()
    } catch (err: any) {
      setActionMsg(err?.response?.data?.message ?? '변경에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AdminLayout title="회원 관리">
      <div style={{ maxWidth: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>회원 관리</h2>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>전체 {users.length}명</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10,
            padding: '0 14px', height: 40,
          }}>
            <i className="bi bi-search" style={{ color: 'var(--t3)', fontSize: 14 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 이메일, 닉네임 검색"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: 'var(--t1)', background: 'transparent', width: 220 }}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', color: 'var(--up)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--t2)' }}>불러오는 중...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--primary-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {['ID', '이름', '이메일', '닉네임', '권한', '상태', '가입일', '액션'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.USER
                  const statusInfo = STATUS_LABELS[user.status] ?? STATUS_LABELS.ACTIVE
                  return (
                    <tr key={user.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--t3)' }}>{user.user_id}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{user.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--t2)' }}>{user.email}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--t2)' }}>@{user.nickname}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                          background: `${roleInfo.color}18`, color: roleInfo.color,
                        }}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                          background: `${statusInfo.color}18`, color: statusInfo.color,
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--t3)' }}>
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handle_open_role(user)}
                            style={{
                              height: 30, padding: '0 10px', borderRadius: 8, fontSize: 12,
                              border: '1px solid var(--border)', background: '#fff',
                              cursor: 'pointer', color: 'var(--t1)', fontWeight: 500,
                            }}
                          >
                            권한 변경
                          </button>
                          <button
                            onClick={() => handle_open_status(user)}
                            style={{
                              height: 30, padding: '0 10px', borderRadius: 8, fontSize: 12,
                              border: '1px solid var(--border)', background: '#fff',
                              cursor: 'pointer', color: 'var(--t1)', fontWeight: 500,
                            }}
                          >
                            상태 변경
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>검색 결과가 없습니다.</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && modal.user && (
        <div
          onClick={handle_close}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 28, width: 360,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                {modal.type === 'role' ? '권한 변경' : '상태 변경'}
              </h3>
              <button onClick={handle_close} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--t2)' }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
              <strong>{modal.user.name}</strong> ({modal.user.email})
            </p>

            {actionMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', color: 'var(--up)', fontSize: 13, marginBottom: 12 }}>
                {actionMsg}
              </div>
            )}

            {modal.type === 'role' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['USER', 'ADMIN'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => handle_update_role(role)}
                    disabled={actionLoading || modal.user?.role === role}
                    style={{
                      height: 44, borderRadius: 10, border: '1.5px solid var(--border)',
                      background: modal.user?.role === role ? 'var(--primary-light)' : '#fff',
                      color: modal.user?.role === role ? 'var(--primary)' : 'var(--t1)',
                      fontWeight: modal.user?.role === role ? 700 : 500,
                      cursor: modal.user?.role === role ? 'default' : 'pointer',
                      fontSize: 14, opacity: actionLoading ? 0.7 : 1,
                    }}
                  >
                    {ROLE_LABELS[role].label} {modal.user?.role === role ? '(현재)' : ''}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['ACTIVE', 'INACTIVE', 'BANNED', 'DELETED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handle_update_status(status)}
                    disabled={actionLoading || modal.user?.status === status}
                    style={{
                      height: 44, borderRadius: 10, border: '1.5px solid var(--border)',
                      background: modal.user?.status === status ? 'var(--primary-light)' : '#fff',
                      color: modal.user?.status === status ? 'var(--primary)' : 'var(--t1)',
                      fontWeight: modal.user?.status === status ? 700 : 500,
                      cursor: modal.user?.status === status ? 'default' : 'pointer',
                      fontSize: 14, opacity: actionLoading ? 0.7 : 1,
                    }}
                  >
                    {STATUS_LABELS[status].label} {modal.user?.status === status ? '(현재)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
