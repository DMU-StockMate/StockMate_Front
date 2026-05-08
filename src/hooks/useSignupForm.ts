import { useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateEmail, validatePassword, getPasswordStrength } from '../utils/validation'

interface FormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export function useSignupForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormValues>({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handle_field = (key: keyof FormValues) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handle_toggle_interest = (item: string) =>
    setInterests((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))

  const handle_submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = '이름을 입력해주세요'
    const emailErr = validateEmail(form.email)
    const passwordErr = validatePassword(form.password)
    if (emailErr) errs.email = emailErr
    if (passwordErr) errs.password = passwordErr
    if (!form.confirmPassword) errs.confirmPassword = '비밀번호를 다시 입력해주세요'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = '비밀번호가 일치하지 않습니다'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      // TODO: 실제 회원가입 API 호출로 교체
      await new Promise((r) => setTimeout(r, 600))
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(form.password)

  return {
    form,
    showPw, setShowPw,
    errors,
    interests,
    loading,
    passwordStrength,
    handle_field,
    handle_toggle_interest,
    handle_submit,
  }
}
