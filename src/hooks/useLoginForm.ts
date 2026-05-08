import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { validateEmail, validatePassword } from '../utils/validation'

interface LoginErrors {
  email?: string
  password?: string
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
      // TODO: 실제 로그인 API 호출로 교체
      await new Promise((r) => setTimeout(r, 600))
      login({ name: '세린', email, level: '초급 Lv.2' })
      navigate(from, { replace: true })
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
