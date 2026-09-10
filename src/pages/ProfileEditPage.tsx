import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/common/Button'
import ProfileInfoForm from '../components/profile/ProfileInfoForm'
import PasswordChangeForm from '../components/profile/PasswordChangeForm'
import { useProfileEditForm } from '../hooks/useProfileEditForm'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const profileEdit = useProfileEditForm()

  return (
    <AppLayout topbarPlaceholder="검색">
      <div className="page-title">
        <div>
          <h1>프로필 편집</h1>
          <div className="page-sub">계정 정보와 비밀번호를 변경하세요</div>
        </div>
        <Button variant="outline" onClick={() => navigate('/mypage')}>
          <i className="bi bi-chevron-left" />
          마이페이지
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
        <ProfileInfoForm
          email={profileEdit.email}
          form={profileEdit.profileForm}
          profileImageUrl={profileEdit.profileImageUrl}
          profileImagePreviewUrl={profileEdit.profileImagePreviewUrl}
          errors={profileEdit.errors}
          saved={profileEdit.profileSaved}
          loading={profileEdit.profileLoading}
          onFieldChange={profileEdit.handleProfileField}
          onProfileImageChange={profileEdit.handleProfileImageChange}
          onSubmit={profileEdit.handleProfileSubmit}
        />

        <PasswordChangeForm
          email={profileEdit.email}
          form={profileEdit.passwordForm}
          errors={profileEdit.errors}
          saved={profileEdit.passwordSaved}
          codeSent={profileEdit.codeSent}
          codeVerified={profileEdit.codeVerified}
          timer={profileEdit.timer}
          showPassword={profileEdit.showPassword}
          sendCodeLoading={profileEdit.sendCodeLoading}
          verifyCodeLoading={profileEdit.verifyCodeLoading}
          passwordLoading={profileEdit.passwordLoading}
          passwordStrength={profileEdit.passwordStrength}
          onFieldChange={profileEdit.handlePasswordField}
          onSendCode={profileEdit.handleSendCode}
          onVerifyCode={profileEdit.handleVerifyCode}
          onShowPasswordChange={profileEdit.setShowPassword}
          onSubmit={profileEdit.handlePasswordSubmit}
        />
      </div>
    </AppLayout>
  )
}
