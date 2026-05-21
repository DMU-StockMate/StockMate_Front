import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api_me } from '../api/auth'

export interface AuthUser {
  id?: number
  name: string
  email: string
  nickname?: string
  phone?: string
  role?: string
  level: string
}

interface AuthState {
  isLoggedIn: boolean
  user: AuthUser | null
}

interface AuthContextType extends AuthState {
  login: (user: AuthUser, token: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, user: null })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setIsLoading(false)
      return
    }
    api_me()
      .then(({ data }) => {
        setAuth({
          isLoggedIn: true,
          user: {
            id: data.user_id,
            name: data.name,
            email: data.email,
            nickname: data.nickname,
            phone: data.phone,
            role: data.role,
            level: '초급 Lv.1',
          },
        })
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = (user: AuthUser, token: string) => {
    localStorage.setItem('accessToken', token)
    setAuth({ isLoggedIn: true, user })
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setAuth({ isLoggedIn: false, user: null })
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
