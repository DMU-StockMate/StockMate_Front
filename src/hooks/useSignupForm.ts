import { useState, useRef, useEffect } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateEmail, validateNewPassword, getPasswordStrength } from '../utils/validation'
import { api_signup } from '../api/auth'
import { api_send_email_code, api_verify_email_code } from '../api/email'
import { useGoogleAuth } from './useGoogleAuth'

interface FormValues {
  name: string
  email: string
  nickname: string
  phone: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  emailCode?: string
  nickname?: string
  phone?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export function useSignupForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormValues>({
    name: '', email: '', nickname: '', phone: '', password: '', confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [emailTimer, setEmailTimer] = useState(0)
  const [sendCodeLoading, setSendCodeLoading] = useState(false)
  const [verifyCodeLoading, setVerifyCodeLoading] = useState(false)
  const sentEmailRef = useRef('')
  const { googleButtonRef, googleLoading } = useGoogleAuth((message) => setErrors({ general: message }))

  useEffect(() => {
    if (!emailCodeSent || emailTimer <= 0) return
    const id = setInterval(() => setEmailTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [emailCodeSent, emailTimer])

  const handle_field = (key: keyof FormValues) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'email' && value !== sentEmailRef.current) {
      setEmailCodeSent(false)
      setEmailVerified(false)
      setEmailCode('')
      setEmailTimer(0)
    }
  }

  const handle_toggle_interest = (item: string) =>
    setInterests((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))

  const handle_send_code = async () => {
    const emailErr = validateEmail(form.email)
    if (emailErr) { setErrors((prev) => ({ ...prev, email: emailErr })); return }
    setErrors((prev) => ({ ...prev, email: undefined, emailCode: undefined }))
    setSendCodeLoading(true)
    try {
      await api_send_email_code(form.email, 'REGISTER')
      sentEmailRef.current = form.email
      setEmailCodeSent(true)
      setEmailVerified(false)
      setEmailCode('')
      setEmailTimer(300)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '인증코드 발송에 실패했습니다.'
      setErrors((prev) => ({ ...prev, email: Array.isArray(msg) ? msg[0] : msg }))
    } finally {
      setSendCodeLoading(false)
    }
  }

  const handle_verify_code = async () => {
    if (!emailCode.trim()) { setErrors((prev) => ({ ...prev, emailCode: '인증코드를 입력해주세요' })); return }
    setErrors((prev) => ({ ...prev, emailCode: undefined }))
    setVerifyCodeLoading(true)
    try {
      await api_verify_email_code(form.email, emailCode, 'REGISTER')
      setEmailVerified(true)
      setEmailTimer(0)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '인증코드 확인에 실패했습니다.'
      setErrors((prev) => ({ ...prev, emailCode: Array.isArray(msg) ? msg[0] : msg }))
    } finally {
      setVerifyCodeLoading(false)
    }
  }

  const format_timer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handle_submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = '이름을 입력해주세요'
    const emailErr = validateEmail(form.email)
    if (emailErr) errs.email = emailErr
    else if (!emailVerified) errs.email = '이메일 인증을 완료해주세요'
    if (!form.nickname.trim()) errs.nickname = '닉네임을 입력해주세요'
    else if (form.nickname.length < 2 || form.nickname.length > 20) errs.nickname = '닉네임은 2~20자여야 합니다'
    if (!form.phone.trim()) errs.phone = '전화번호를 입력해주세요'
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone)) errs.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    const passwordErr = validateNewPassword(form.password)
    if (passwordErr) errs.password = passwordErr
    if (!form.confirmPassword) errs.confirmPassword = '비밀번호를 다시 입력해주세요'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = '비밀번호가 일치하지 않습니다'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await api_signup({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        name: form.name,
        phone: form.phone,
      })
      navigate('/login')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? '회원가입에 실패했습니다. 다시 시도해주세요.'
      setErrors({ general: Array.isArray(msg) ? msg[0] : msg })
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
    googleLoading,
    googleButtonRef,
    passwordStrength,
    emailCodeSent,
    emailVerified,
    emailCode,
    setEmailCode,
    emailTimer,
    sendCodeLoading,
    verifyCodeLoading,
    handle_field,
    handle_toggle_interest,
    handle_send_code,
    handle_verify_code,
    format_timer,
    handle_submit,
  }
}
