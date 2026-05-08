import { api } from './axios'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
  interests: string[]
}

export const api_login = (data: LoginRequest) =>
  api.post('/auth/login', data)

export const api_signup = (data: SignupRequest) =>
  api.post('/auth/signup', data)
