import type { ChangeEvent, FormEvent } from 'react'
import Card from '../common/Card'
import Button from '../common/Button'
import Input from '../common/Input'
import ProfileAvatar from '../common/ProfileAvatar'
import type { ProfileEditErrors, ProfileFormValues } from '../../hooks/useProfileEditForm'

interface ProfileInfoFormProps {
  email: string
  form: ProfileFormValues
  profileImageUrl: string
  profileImagePreviewUrl: string
  errors: ProfileEditErrors
  saved: boolean
  loading: boolean
  onFieldChange: (key: keyof ProfileFormValues) => (e: ChangeEvent<HTMLInputElement>) => void
  onProfileImageChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent) => void
}

export default function ProfileInfoForm({
  email,
  form,
  profileImageUrl,
  profileImagePreviewUrl,
  errors,
  saved,
  loading,
  onFieldChange,
  onProfileImageChange,
  onSubmit,
}: ProfileInfoFormProps) {
  return (
    <Card>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 4 }}>기본 정보</div>
          <div className="muted" style={{ fontSize: 13 }}>이메일은 로그인 계정으로 사용되어 변경할 수 없습니다</div>
        </div>

        {errors.profileGeneral && (
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--up-light)', color: 'var(--up)', fontSize: 13 }}>
            {errors.profileGeneral}
          </div>
        )}
        {saved && (
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--success-light, #ECFDF5)', color: 'var(--success)', fontSize: 13 }}>
            프로필 정보가 저장되었습니다.
          </div>
        )}

        <div className="profile-image-field">
          <ProfileAvatar
            src={profileImagePreviewUrl || profileImageUrl}
            name={form.nickname || form.name}
            className="profile-image-preview"
          />
          <div className="profile-image-copy">
            <div className="input-label">프로필 사진</div>
            <div className="muted" style={{ fontSize: 12 }}>jpg, png, webp · 최대 5MB</div>
            <label className="profile-image-picker" htmlFor="profile-image-input">
              <i className="bi bi-camera" />
              {profileImagePreviewUrl ? '선택한 이미지 변경' : '이미지 선택'}
            </label>
            <input
              id="profile-image-input"
              className="profile-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onProfileImageChange}
            />
            {errors.profileImage && <span className="input-error-msg">{errors.profileImage}</span>}
          </div>
        </div>

        <Input label="이메일" value={email} disabled leftIcon={<i className="bi bi-envelope" />} />
        <Input
          label="이름"
          value={form.name}
          onChange={onFieldChange('name')}
          error={errors.name}
          leftIcon={<i className="bi bi-person" />}
          autoComplete="name"
        />
        <Input
          label="닉네임"
          value={form.nickname}
          onChange={onFieldChange('nickname')}
          error={errors.nickname}
          leftIcon={<i className="bi bi-at" />}
          autoComplete="username"
        />
        <Input
          label="전화번호"
          value={form.phone}
          onChange={onFieldChange('phone')}
          error={errors.phone}
          leftIcon={<i className="bi bi-phone" />}
          autoComplete="tel"
        />

        <Button type="submit" disabled={loading}>
          <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-check2-circle'}`} />
          {loading ? '저장 중...' : '프로필 저장'}
        </Button>
      </form>
    </Card>
  )
}
