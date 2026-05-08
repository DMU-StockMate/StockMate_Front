export const validateEmail = (email: string): string | undefined => {
  if (!email) return '이메일을 입력해주세요'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다'
}

export const validatePassword = (password: string): string | undefined => {
  if (!password) return '비밀번호를 입력해주세요'
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다'
}

export const getPasswordStrength = (pw: string) => {
  if (!pw) return null
  if (pw.length < 8) return { label: '짧음', color: 'var(--up)', pct: 25 }
  if (pw.length >= 12 && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw))
    return { label: '강함', color: 'var(--success)', pct: 100 }
  if (/[A-Z]/.test(pw) && /\d/.test(pw)) return { label: '보통', color: 'var(--warning)', pct: 65 }
  return { label: '약함', color: 'var(--warning)', pct: 40 }
}
