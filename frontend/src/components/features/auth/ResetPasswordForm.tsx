import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ResetPasswordSchemaType } from "@/schemas/auth.schema"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"

/**
 * Props for ResetPasswordForm component.
 */
export interface ResetPasswordFormProps {
  register: UseFormRegister<ResetPasswordSchemaType>
  errors: FieldErrors<ResetPasswordSchemaType>
  showPassword: boolean
  onTogglePassword: () => void
  isResettingPassword: boolean
  onSubmit: (e: React.FormEvent) => void
  onBackToLogin: () => void
}

/**
 * Presenter component rendering the new password form inputs, validation, and action buttons.
 */
export function ResetPasswordForm({
  register,
  errors,
  showPassword,
  onTogglePassword,
  isResettingPassword,
  onSubmit,
  onBackToLogin,
}: ResetPasswordFormProps) {
  return (
    <>
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Thiết lập mật khẩu mới
        </h2>
        <p className="text-sm text-muted-foreground">
          Nhập mật khẩu mới an toàn cho tài khoản của bạn.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
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
              onClick={onTogglePassword}
              className="absolute right-4 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
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
          className="w-full text-sm font-semibold rounded-full"
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
          onClick={onBackToLogin}
          className="w-full text-sm font-semibold flex items-center justify-center gap-2 rounded-full"
        >
          Quay lại đăng nhập
        </Button>
      </form>
    </>
  )
}
