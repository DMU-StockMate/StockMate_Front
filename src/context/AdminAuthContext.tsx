import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api_me } from '../api/auth'

interface AdminUser {
  id: number
  name: string
  email: string
  role: string
}

interface AdminAuthState {
  isAdminLoggedIn: boolean
  adminUser: AdminUser | null
  isLoading: boolean
}

interface AdminAuthContextType extends AdminAuthState {
  adminLogin: (user: AdminUser, token: string) => void
  adminLogout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    isAdminLoggedIn: false,
    adminUser: null,
    isLoading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }
    // Temporarily set token to verify with /users/me
    const prev = localStorage.getItem('accessToken')
    localStorage.setItem('accessToken', token)
    api_me()
      .then(({ data }) => {
        if (data.role === 'ADMIN') {
          setState({
            isAdminLoggedIn: true,
            adminUser: { id: data.user_id, name: data.name, email: data.email, role: data.role },
            isLoading: false,
          })
        } else {
          localStorage.removeItem('adminToken')
          setState({ isAdminLoggedIn: false, adminUser: null, isLoading: false })
        }
      })
      .catch(() => {
        localStorage.removeItem('adminToken')
        setState({ isAdminLoggedIn: false, adminUser: null, isLoading: false })
      })
      .finally(() => {
        // Restore original token
        if (prev) localStorage.setItem('accessToken', prev)
        else localStorage.removeItem('accessToken')
      })
  }, [])

  const adminLogin = (user: AdminUser, token: string) => {
    localStorage.setItem('adminToken', token)
    setState({ isAdminLoggedIn: true, adminUser: user, isLoading: false })
  }

  const adminLogout = () => {
    localStorage.removeItem('adminToken')
    setState({ isAdminLoggedIn: false, adminUser: null, isLoading: false })
  }

  return (
    <AdminAuthContext.Provider value={{ ...state, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth(): AdminAuthContextType {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
