import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { BRANDING_CONFIG } from "@/config/branding.config"
import { ROUTES } from "@/config/routes.config"
import { useAuth } from "@/hooks/use-auth.ts"
import { resetPasswordSchema } from "@/schemas/auth.schema.ts"
import type { ResetPasswordSchemaType } from "@/schemas/auth.schema.ts"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, XCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

const GeometricBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-35">
    <svg className="h-full w-full" viewBox="0 0 800 800" preserveAspectRatio="none" fill="none">
      <path d="M-100,-100 L450,150 L250,650 L-100,550 Z" fill="url(#geom-grad)" />
      <path d="M350,50 L950,350 L650,850 L250,750 Z" fill="url(#geom-grad-2)" />
      <defs>
        <linearGradient id="geom-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.12" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="geom-grad-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
)

const BrandLogo = () => (
  <img
    src={BRANDING_CONFIG.LOGO_URL}
    alt={BRANDING_CONFIG.LOGO_ALT}
    className="size-14 rounded-lg object-cover shadow-lg"
  />
)

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const { validateResetToken, resetPassword, isResettingPassword } = useAuth()

  const [isValidating, setIsValidating] = useState(!!token)
  const [tokenValid, setTokenValid] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
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

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Đang xác thực liên kết...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="mx-auto w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <XCircle className="h-20 w-20 text-destructive opacity-80" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Liên kết không hợp lệ</h1>
            <p className="text-muted-foreground">
              Liên kết đặt lại mật khẩu đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu lại.
            </p>
          </div>
          <Button
            onClick={() => {
              navigate(ROUTES.AUTH.LOGIN)
            }}
            className="w-full h-12 rounded-full"
          >
            Quay lại đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Left Column: Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-linear-to-br from-login-grad-start via-login-grad-mid to-login-grad-end p-12 text-white overflow-hidden lg:flex">
        <GeometricBackground />
        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo />
          <span className="text-xl font-bold tracking-wide">{BRANDING_CONFIG.APP_NAME}</span>
        </div>
        <div className="relative z-10 my-auto flex flex-col items-start space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Đặt lại mật khẩu</h1>
          <p className="text-white/80 text-base leading-relaxed">
            Thiết lập mật khẩu mới cho tài khoản của bạn để tiếp tục truy cập hệ thống.
          </p>
        </div>
        <div className="relative z-10 h-10" />
      </div>

      {/* Right Column: Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Thiết lập mật khẩu mới
            </h2>
            <p className="text-sm text-muted-foreground">
              Nhập mật khẩu mới an toàn cho tài khoản của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register("token")} />

            <div className="space-y-2">
              <Label htmlFor="newPassword" title="Mật khẩu mới">
                Mật khẩu mới
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("newPassword")}
                  className={
                    errors.newPassword
                      ? "border-destructive pr-12 rounded-full"
                      : "pr-12 rounded-full"
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword)
                  }}
                  className="absolute right-4 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs font-medium text-destructive ml-4">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-full"
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                navigate(ROUTES.AUTH.LOGIN)
              }}
              className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2 rounded-full"
            >
              Quay lại đăng nhập
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
