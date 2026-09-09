export const validateEmail = (email: string): string | undefined => {
  if (!email) return '이메일을 입력해주세요'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다'
}

// 로그인용: 백엔드가 형식 검증 없이 존재 여부만 확인하므로(bcrypt 비교로 판단) 동일하게 맞춤
export const validatePassword = (password: string): string | undefined => {
  if (!password) return '비밀번호를 입력해주세요'
}

// 신규 비밀번호용: 백엔드 CreateUserDto/ResetPasswordDto/ChangePasswordDto.newPassword와 동일한 규칙
export const validateNewPassword = (password: string): string | undefined => {
  if (!password) return '비밀번호를 입력해주세요'
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/.test(password)) {
    return '비밀번호는 8~20자이며, 영문과 숫자를 포함해야 합니다.'
  }
}

export const getPasswordStrength = (pw: string) => {
  if (!pw) return null
  if (pw.length < 8) return { label: '짧음', color: 'var(--up)', pct: 25 }
  if (pw.length >= 12 && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw))
    return { label: '강함', color: 'var(--success)', pct: 100 }
  if (/[A-Z]/.test(pw) && /\d/.test(pw)) return { label: '보통', color: 'var(--warning)', pct: 65 }
  return { label: '약함', color: 'var(--warning)', pct: 40 }
}
