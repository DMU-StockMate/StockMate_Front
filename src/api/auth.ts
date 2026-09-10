import { api } from './axios'

export interface LoginRequest {
  email: string
  password: string
}

export interface GoogleLoginRequest {
  idToken: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface SignupRequest {
  email: string
  password: string
  nickname: string
  name: string
  phone: string
}

export interface UserProfile {
  user_id: number
  email: string
  name: string
  nickname: string
  phone: string
  role: string
  status: string
  investment_level_id: number | null
  profile_image_url: string | null
  created_at: string
  updated_at: string
}

export interface UpdateUserRequest {
  nickname: string
  name?: string
  phone?: string
}

export interface ProfileImageResponse {
  message: string
  profileImageUrl: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const api_login = (data: LoginRequest) =>
  api.post<LoginResponse>('/users/login', data)

export const api_google_login = (data: GoogleLoginRequest) =>
  api.post<LoginResponse>('/users/google-login', data)

export const api_signup = (data: SignupRequest) =>
  api.post('/users/signup', data)

export const api_me = () =>
  api.get<UserProfile>('/users/me')

export const api_logout = () =>
  api.post('/users/logout')

export const api_update_user = (data: UpdateUserRequest) =>
  api.patch<UserProfile>('/users', data)

export const api_upload_profile_image = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<ProfileImageResponse>('/users/me/profile-image', formData)
}

export const api_change_password = (data: ChangePasswordRequest) =>
  api.patch('/users/change-password', data)

export const api_withdraw = (data: { password?: string; googleIdToken?: string }) =>
  api.delete('/users', { data })

export const api_find_email = (data: { name: string; phone: string }) =>
  api.post<{ email: string }>('/users/find-email', data)

export const api_reset_password = (data: { email: string; newPassword: string }) =>
  api.post('/users/reset-password', data)

export const api_check_email = (email: string) =>
  api.get('/users/check-email', { params: { email } })

export const api_check_nickname = (nickname: string) =>
  api.get('/users/check-nickname', { params: { nickname } })
