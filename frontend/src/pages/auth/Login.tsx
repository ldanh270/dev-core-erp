import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { BRANDING_CONFIG } from "@/config/branding.config"
import { useLogin } from "@/hooks/auth/useLogin"
import MockSpreadsheetCard from "@/pages/auth/mock-spreadsheet"

import { Eye, EyeOff, KeyRound } from "lucide-react"

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
    className="size-14 rounded-lg object-cover shadow-lg transition-transform hover:scale-105"
  />
)

/**
 * Login page component
 * Implements a modern split-panel layout: brand identity on the left, login form on the right
 */
export default function Login() {
  const {
    loginForm,
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

  const {
    register,
    formState: { errors },
  } = loginForm

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Left Column: Visual branding and mockup (Only on lg screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-linear-to-br from-login-grad-start via-login-grad-mid to-login-grad-end p-12 text-white overflow-hidden lg:flex">
        <GeometricBackground />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo />
          <span className="text-xl font-bold tracking-wide">{BRANDING_CONFIG.APP_NAME}</span>
        </div>

        {/* Feature Teaser */}
        <div className="relative z-10 my-auto flex flex-col items-start space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Designed for Individuals</h1>
          <p className="text-white/80 text-base leading-relaxed">
            See the analytics and grow your data remotely, from anywhere!
          </p>
          {/* Slider Pagination Dots */}
          <div className="flex items-center gap-2 pt-2">
            <span className="h-2.5 w-6 rounded-full bg-white transition-all" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/40 hover:bg-white/60 cursor-pointer transition-all" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/40 hover:bg-white/60 cursor-pointer transition-all" />
          </div>
        </div>

        {/* Floating Mock Spreadsheet Card */}
        <div className="relative z-10 flex justify-center pb-8">
          <MockSpreadsheetCard />
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Form Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Login</h2>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="ml-5 text-sm font-medium text-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="admin.hr"
                {...register("username")}
                className={
                  errors.username ? "border-destructive focus-visible:ring-destructive" : ""
                }
              />
              {errors.username && (
                <p className="ml-5 text-xs font-medium text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="ml-5 text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`pr-12 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword((prev) => !prev)
                  }}
                  className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="ml-5 text-xs font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Reset Password Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowForgotModal(true)
            }}
            className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2 border-border shadow-sm hover:bg-secondary/40"
          >
            <KeyRound size={16} />
            <span>Reset Password</span>
          </Button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleForgotPassword}
            className="bg-card border border-border w-full max-w-md rounded-xl shadow-lg p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">Quên Mật Khẩu</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vui lòng nhập email của bạn. Hệ thống sẽ gửi liên kết đặt lại mật khẩu về email này.
              </p>
            </div>

            <div className="space-y-2 mt-2">
              <Label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Nhập email của bạn..."
                required
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value)
                }}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false)
                  setForgotEmail("")
                }}
                className="px-4 py-2 border border-border text-foreground hover:bg-secondary rounded-full text-xs font-semibold cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSendingForgotPassword || !forgotEmail.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-full text-xs font-semibold shadow-sm cursor-pointer transition-colors"
              >
                {isSendingForgotPassword ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
