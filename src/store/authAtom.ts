import { atom } from 'recoil'

export interface AuthUser {
  name: string
  email: string
  level: string
}

export interface AuthState {
  isLoggedIn: boolean
  user: AuthUser | null
}

export const authAtom = atom<AuthState>({
  key: 'authAtom',
  default: {
    isLoggedIn: false,
    user: null,
  },
})
