import { createContext, useContext, useState, ReactNode } from 'react'

export interface AuthUser {
  name: string
  email: string
  level: string
}

interface AuthState {
  isLoggedIn: boolean
  user: AuthUser | null
}

interface AuthContextType extends AuthState {
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, user: null })

  const login = (user: AuthUser) => setAuth({ isLoggedIn: true, user })
  const logout = () => setAuth({ isLoggedIn: false, user: null })

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
