import { AuthSplitLayout } from "@/components/features/auth/AuthSplitLayout"
import { ForgotPasswordDialog } from "@/components/features/auth/ForgotPasswordDialog"
import { LoginForm } from "@/components/features/auth/LoginForm"
import MockSpreadsheetCard from "@/components/features/auth/MockSpreadsheetCard"
import { useLogin } from "@/hooks/auth/useLogin"

/**
 * Login page component
 * Pure declarative orchestrator coordinating authentication state and presenters.
 */
export default function Login() {
  const {
    loginForm: {
      register,
      formState: { errors },
    },
    showPassword,
    setShowPassword,
    showForgotModal,
    setShowForgotModal,
    forgotEmail,
    setForgotEmail,
    isLoggingIn,
    isSendingForgotPassword,
    onSubmit,
    handleForgotPassword,
  } = useLogin()

  return (
    <AuthSplitLayout
      title="Designed for Individuals"
      description="See the analytics and grow your data remotely, from anywhere!"
      showSliderDots
      bottomSlot={<MockSpreadsheetCard />}
    >
      <LoginForm
        register={register}
        errors={errors}
        showPassword={showPassword}
        onTogglePassword={() => {
          setShowPassword((prev) => !prev)
        }}
        isLoggingIn={isLoggingIn}
        onSubmit={onSubmit}
        onOpenForgotPassword={() => {
          setShowForgotModal(true)
        }}
      />

      <ForgotPasswordDialog
        isOpen={showForgotModal}
        onClose={() => {
          setShowForgotModal(false)
          setForgotEmail("")
        }}
        email={forgotEmail}
        onEmailChange={setForgotEmail}
        onSubmit={handleForgotPassword}
        isSubmitting={isSendingForgotPassword}
      />
    </AuthSplitLayout>
  )
}
