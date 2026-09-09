import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api_me, api_reset_password, api_update_user } from '../api/auth'
import { api_send_email_code, api_verify_email_code } from '../api/email'
import { useAuth } from './useAuth'
import { getPasswordStrength, validateNewPassword } from '../utils/validation'

export interface ProfileFormValues {
  name: string
  nickname: string
  phone: string
}

export interface PasswordFormValues {
  code: string
  newPassword: string
  confirmPassword: string
}

export interface ProfileEditErrors {
  name?: string
  nickname?: string
  phone?: string
  code?: string
  newPassword?: string
  confirmPassword?: string
  profileGeneral?: string
  passwordGeneral?: string
}

const error_message = (err: any, fallback: string) => {
  const msg = err?.response?.data?.message ?? fallback
  return Array.isArray(msg) ? msg[0] : msg
}

export const format_timer = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function useProfileEditForm() {
  const { user, updateUser } = useAuth()
  const [profileForm, setProfileForm] = useState<ProfileFormValues>({
    name: user?.name ?? '',
    nickname: user?.nickname ?? '',
    phone: user?.phone ?? '',
  })
  const [passwordForm, setPasswordForm] = useState<PasswordFormValues>({
    code: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [email, setEmail] = useState(user?.email ?? '')
  const [errors, setErrors] = useState<ProfileEditErrors>({})
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [sendCodeLoading, setSendCodeLoading] = useState(false)
  const [verifyCodeLoading, setVerifyCodeLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [timer, setTimer] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const sentEmailRef = useRef('')

  useEffect(() => {
    api_me()
      .then(({ data }) => {
        setEmail(data.email)
        setProfileForm({
          name: data.name ?? '',
          nickname: data.nickname ?? '',
          phone: data.phone ?? '',
        })
        updateUser({
          id: data.user_id,
          email: data.email,
          name: data.name,
          nickname: data.nickname,
          phone: data.phone,
          role: data.role,
        })
      })
      .catch(() => {})
  }, [updateUser])

  useEffect(() => {
    if (!codeSent || timer <= 0) return
    const id = window.setInterval(() => setTimer((prev) => prev - 1), 1000)
    return () => window.clearInterval(id)
  }, [codeSent, timer])

  const handleProfileField = useCallback((key: keyof ProfileFormValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setProfileSaved(false)
    setProfileForm((prev) => ({ ...prev, [key]: e.target.value }))
  }, [])

  const handlePasswordField = useCallback((key: keyof PasswordFormValues) => (e: ChangeEvent<HTMLInputElement>) => {
    setPasswordSaved(false)
    setPasswordForm((prev) => ({ ...prev, [key]: e.target.value }))
  }, [])

  const validateProfile = useCallback(() => {
    const nextErrors: ProfileEditErrors = {}
    if (!profileForm.name.trim()) nextErrors.name = '이름을 입력해주세요'
    if (!profileForm.nickname.trim()) nextErrors.nickname = '닉네임을 입력해주세요'
    else if (profileForm.nickname.length < 2 || profileForm.nickname.length > 20) {
      nextErrors.nickname = '닉네임은 2~20자여야 합니다'
    } else if (!/^[a-zA-Z0-9가-힣]+$/.test(profileForm.nickname)) {
      nextErrors.nickname = '닉네임은 한글, 영문, 숫자만 가능합니다'
    }
    if (profileForm.phone && !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(profileForm.phone)) {
      nextErrors.phone = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    }
    return nextErrors
  }, [profileForm])

  const handleProfileSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors = validateProfile()
    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors, profileGeneral: undefined }))
      return
    }

    setProfileLoading(true)
    setProfileSaved(false)
    setErrors((prev) => ({ ...prev, profileGeneral: undefined }))
    try {
      const { data } = await api_update_user({
        name: profileForm.name.trim(),
        nickname: profileForm.nickname.trim(),
        phone: profileForm.phone.trim(),
      })
      updateUser({
        id: data.user_id,
        email: data.email,
        name: data.name,
        nickname: data.nickname,
        phone: data.phone,
        role: data.role,
      })
      setProfileSaved(true)
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        profileGeneral: error_message(err, '프로필 수정에 실패했습니다.'),
      }))
    } finally {
      setProfileLoading(false)
    }
  }, [profileForm, updateUser, validateProfile])

  const handleSendCode = useCallback(async () => {
    if (!email) return
    setSendCodeLoading(true)
    setCodeVerified(false)
    setPasswordSaved(false)
    setErrors((prev) => ({ ...prev, code: undefined, passwordGeneral: undefined }))
    try {
      await api_send_email_code(email, 'RESET_PASSWORD')
      sentEmailRef.current = email
      setCodeSent(true)
      setPasswordForm((prev) => ({ ...prev, code: '' }))
      setTimer(300)
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        passwordGeneral: error_message(err, '인증번호 발송에 실패했습니다.'),
      }))
    } finally {
      setSendCodeLoading(false)
    }
  }, [email])

  const handleVerifyCode = useCallback(async () => {
    if (!passwordForm.code.trim()) {
      setErrors((prev) => ({ ...prev, code: '인증번호를 입력해주세요' }))
      return
    }

    setVerifyCodeLoading(true)
    setErrors((prev) => ({ ...prev, code: undefined, passwordGeneral: undefined }))
    try {
      await api_verify_email_code(sentEmailRef.current || email, passwordForm.code, 'RESET_PASSWORD')
      setCodeVerified(true)
      setTimer(0)
    } catch (err: any) {
      setCodeVerified(false)
      setErrors((prev) => ({
        ...prev,
        code: error_message(err, '인증번호 확인에 실패했습니다.'),
      }))
    } finally {
      setVerifyCodeLoading(false)
    }
  }, [email, passwordForm.code])

  const handlePasswordSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: ProfileEditErrors = {}
    if (!codeVerified) nextErrors.code = '이메일 인증을 완료해주세요'
    const newPasswordError = validateNewPassword(passwordForm.newPassword)
    if (newPasswordError) nextErrors.newPassword = newPasswordError
    if (!passwordForm.confirmPassword) nextErrors.confirmPassword = '새 비밀번호를 다시 입력해주세요'
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors, passwordGeneral: undefined }))
      return
    }

    setPasswordLoading(true)
    setPasswordSaved(false)
    setErrors((prev) => ({ ...prev, passwordGeneral: undefined }))
    try {
      await api_reset_password({ email, newPassword: passwordForm.newPassword })
      setPasswordSaved(true)
      setCodeSent(false)
      setCodeVerified(false)
      setTimer(0)
      setPasswordForm({ code: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        passwordGeneral: error_message(err, '비밀번호 변경에 실패했습니다.'),
      }))
    } finally {
      setPasswordLoading(false)
    }
  }, [codeVerified, email, passwordForm])

  return {
    email,
    profileForm,
    passwordForm,
    errors,
    profileSaved,
    passwordSaved,
    profileLoading,
    sendCodeLoading,
    verifyCodeLoading,
    passwordLoading,
    codeSent,
    codeVerified,
    timer,
    showPassword,
    setShowPassword,
    passwordStrength: getPasswordStrength(passwordForm.newPassword),
    handleProfileField,
    handlePasswordField,
    handleProfileSubmit,
    handleSendCode,
    handleVerifyCode,
    handlePasswordSubmit,
  }
}
