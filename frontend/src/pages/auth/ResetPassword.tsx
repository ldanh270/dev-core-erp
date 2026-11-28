import { AuthSplitLayout } from "@/components/features/auth/AuthSplitLayout"
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm"
import {
  InvalidTokenCard,
  ValidatingTokenLoader,
} from "@/components/features/auth/ResetPasswordStates"
import { useResetPassword } from "@/hooks/auth/useResetPassword"

/**
 * ResetPassword page component
 * Pure declarative orchestrator coordinating token verification state and forms.
 */
export default function ResetPassword() {
  const {
    isValidating,
    tokenValid,
    showPassword,
    setShowPassword,
    form: {
      register,
      formState: { errors },
    },
    isResettingPassword,
    onSubmit,
    backToLogin,
  } = useResetPassword()

  if (isValidating) {
    return <ValidatingTokenLoader />
  }

  if (!tokenValid) {
    return <InvalidTokenCard onBackToLogin={backToLogin} />
  }

  return (
    <AuthSplitLayout
      title="Đặt lại mật khẩu"
      description="Thiết lập mật khẩu mới cho tài khoản của bạn để tiếp tục truy cập hệ thống."
    >
      <ResetPasswordForm
        register={register}
        errors={errors}
        showPassword={showPassword}
        onTogglePassword={() => {
          setShowPassword((prev) => !prev)
        }}
        isResettingPassword={isResettingPassword}
        onSubmit={onSubmit}
        onBackToLogin={backToLogin}
      />
    </AuthSplitLayout>
  )
}
