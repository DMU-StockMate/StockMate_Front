import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api_get_investment_profile } from '../api/investmentProfile'
import { api_google_login, api_me } from '../api/auth'
import { useAuth } from './useAuth'
import { render_google_button } from '../utils/googleAuth'

export function useGoogleAuth(onError: (message: string) => void) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const onErrorRef = useRef(onError)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (!googleButtonRef.current) return

    const finish_login = async (accessToken: string) => {
      localStorage.setItem('accessToken', accessToken)
      const { data: profile } = await api_me()
      login({
        id: profile.user_id,
        name: profile.name,
        email: profile.email,
        nickname: profile.nickname,
        phone: profile.phone,
        role: profile.role,
        profileImageUrl: profile.profile_image_url,
        level: '초급 Lv.1',
      }, accessToken)
      const diagnosed = await api_get_investment_profile().then(() => true).catch(() => false)
      navigate(diagnosed ? from : '/onboarding/investment-profile', { replace: true })
    }

    render_google_button(googleButtonRef.current, async (response) => {
      if (!response.credential) return
      setGoogleLoading(true)
      try {
        const { data } = await api_google_login({ idToken: response.credential })
        await finish_login(data.accessToken)
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? '구글 로그인에 실패했습니다.'
        onErrorRef.current(Array.isArray(msg) ? msg[0] : msg)
      } finally {
        setGoogleLoading(false)
      }
    }).catch(() => onErrorRef.current('구글 로그인 스크립트를 불러오지 못했습니다.'))
  }, [from, login, navigate])

  return { googleButtonRef, googleLoading }
}
