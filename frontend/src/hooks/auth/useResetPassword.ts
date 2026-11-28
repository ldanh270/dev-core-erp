import { ROUTES } from "@/config/routes.config"
import { useAuth } from "@/hooks/use-auth"
import { resetPasswordSchema } from "@/schemas/auth.schema"
import type { ResetPasswordSchemaType } from "@/schemas/auth.schema"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

/**
 * Custom hook managing reset password token validation, form submission, and navigation.
 */
export function useResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const { validateResetToken, resetPassword, isResettingPassword } = useAuth()

  const [isValidating, setIsValidating] = useState(!!token)
  const [tokenValid, setTokenValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
    },
  })

  useEffect(() => {
    if (!token) return

    const checkToken = async () => {
      try {
        const result = await validateResetToken(token)
        setTokenValid(result.isValid)
      } catch {
        setTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    void checkToken()
  }, [token, validateResetToken])

  const onSubmit = async (data: ResetPasswordSchemaType) => {
    try {
      await resetPassword(data)
      toast.success("Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.")
      navigate(ROUTES.AUTH.LOGIN)
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Không thể đặt lại mật khẩu")
    }
  }

  return {
    isValidating,
    tokenValid,
    showPassword,
    setShowPassword,
    form,
    isResettingPassword,
    onSubmit: form.handleSubmit(onSubmit),
    backToLogin: () => navigate(ROUTES.AUTH.LOGIN),
  }
}
