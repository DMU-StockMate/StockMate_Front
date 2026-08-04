import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { validateEmail, validatePassword } from '../utils/validation'
import { api_login, api_me } from '../api/auth'
import { api_get_investment_profile } from '../api/investmentProfile'

interface LoginErrors {
  email?: string
  password?: string
  general?: string
}

export function useLoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const handle_submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: LoginErrors = {}
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    if (emailErr) errs.email = emailErr
    if (passwordErr) errs.password = passwordErr
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const { data: tokens } = await api_login({ email, password })
      localStorage.setItem('accessToken', tokens.accessToken)
      const { data: profile } = await api_me()
      login(
        {
          id: profile.user_id,
          name: profile.name,
          email: profile.email,
          nickname: profile.nickname,
          phone: profile.phone,
          role: profile.role,
          level: '초급 Lv.1',
        },
        tokens.accessToken,
      )
      const diagnosed = await api_get_investment_profile().then(() => true).catch(() => false)
      navigate(diagnosed ? from : '/onboarding/investment-profile', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    errors,
    loading,
    handle_submit,
  }
}
