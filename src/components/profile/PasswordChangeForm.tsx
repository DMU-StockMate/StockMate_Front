import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react'
import Card from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'
import { format_timer, type PasswordFormValues, type ProfileEditErrors } from '../../hooks/useProfileEditForm'

interface PasswordChangeFormProps {
  email: string
  form: PasswordFormValues
  errors: ProfileEditErrors
  saved: boolean
  codeSent: boolean
  codeVerified: boolean
  timer: number
  showPassword: boolean
  sendCodeLoading: boolean
  verifyCodeLoading: boolean
  passwordLoading: boolean
  passwordStrength: { label: string; color: string; pct: number } | null
  onFieldChange: (key: keyof PasswordFormValues) => (e: ChangeEvent<HTMLInputElement>) => void
  onSendCode: () => void
  onVerifyCode: () => void
  onShowPasswordChange: Dispatch<SetStateAction<boolean>>
  onSubmit: (e: FormEvent) => void
}

export default function PasswordChangeForm({
  email,
  form,
  errors,
  saved,
  codeSent,
  codeVerified,
  timer,
  showPassword,
  sendCodeLoading,
  verifyCodeLoading,
  passwordLoading,
  passwordStrength,
  onFieldChange,
  onSendCode,
  onVerifyCode,
  onShowPasswordChange,
  onSubmit,
}: PasswordChangeFormProps) {
  return (
    <Card>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>비밀번호 변경</div>
          <div className="muted" style={{ fontSize: 13 }}>가입 이메일로 받은 인증번호를 확인한 뒤 변경할 수 있습니다</div>
        </div>

        {errors.passwordGeneral && (
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--up-light)', color: 'var(--up)', fontSize: 13 }}>
            {errors.passwordGeneral}
          </div>
        )}
        {saved && (
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--success-light, #ECFDF5)', color: 'var(--success)', fontSize: 13 }}>
            비밀번호가 변경되었습니다.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input label="인증 이메일" value={email} disabled leftIcon={<i className="bi bi-envelope-check" />} />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onSendCode}
            disabled={sendCodeLoading || !email}
            style={{ height: 44, whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-send" />
            {sendCodeLoading ? '발송 중...' : codeSent ? '재발송' : '인증번호 발송'}
          </Button>
        </div>

        {codeSent && !codeVerified && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Input
                label="인증번호"
                value={form.code}
                onChange={onFieldChange('code')}
                error={errors.code}
                placeholder="6자리 인증번호"
                maxLength={6}
                leftIcon={<i className="bi bi-shield-lock" />}
              />
              {timer > 0 && (
                <span style={{
                  position: 'absolute',
                  right: 12,
                  top: 34,
                  fontSize: 12,
                  color: timer < 60 ? 'var(--up)' : 'var(--t3)',
                  fontWeight: 700,
                }}>
                  {format_timer(timer)}
                </span>
              )}
            </div>
            <Button
              type="button"
              onClick={onVerifyCode}
              disabled={verifyCodeLoading || !form.code.trim()}
              style={{ height: 44, whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-check2" />
              {verifyCodeLoading ? '확인 중...' : '확인'}
            </Button>
          </div>
        )}

        {codeVerified && (
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
            이메일 인증이 완료되었습니다.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Input
            label="새 비밀번호"
            type={showPassword ? 'text' : 'password'}
            value={form.newPassword}
            onChange={onFieldChange('newPassword')}
            error={errors.newPassword}
            placeholder="영문과 숫자 포함 8~20자"
            leftIcon={<i className="bi bi-lock" />}
            rightIcon={
              <button
                type="button"
                onClick={() => onShowPasswordChange((prev) => !prev)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, display: 'flex' }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            }
            autoComplete="new-password"
            disabled={!codeVerified}
          />
          {passwordStrength && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: '#EFEBF6', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${passwordStrength.pct}%`, height: '100%', background: passwordStrength.color, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        <Input
          label="새 비밀번호 확인"
          type={showPassword ? 'text' : 'password'}
          value={form.confirmPassword}
          onChange={onFieldChange('confirmPassword')}
          error={errors.confirmPassword}
          placeholder="새 비밀번호 다시 입력"
          leftIcon={<i className="bi bi-lock-fill" />}
          autoComplete="new-password"
          disabled={!codeVerified}
        />

        <Button type="submit" disabled={passwordLoading || !codeVerified}>
          <i className={`bi ${passwordLoading ? 'bi-arrow-repeat' : 'bi-key'}`} />
          {passwordLoading ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </form>
    </Card>
  )
}
