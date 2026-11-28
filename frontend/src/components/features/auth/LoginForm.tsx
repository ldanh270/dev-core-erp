import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LoginSchemaType } from "@/schemas/auth.schema"

import { Database, Eye, EyeOff, KeyRound } from "lucide-react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { Link } from "react-router-dom"

/**
 * Props for LoginForm component.
 */
export interface LoginFormProps {
  register: UseFormRegister<LoginSchemaType>
  errors: FieldErrors<LoginSchemaType>
  showPassword: boolean
  onTogglePassword: () => void
  isLoggingIn: boolean
  onSubmit: (e: React.FormEvent) => void
  onOpenForgotPassword: () => void
}

/**
 * Presenter component rendering the login form inputs, validation feedback, and action triggers.
 */
export function LoginForm({
  register,
  errors,
  showPassword,
  onTogglePassword,
  isLoggingIn,
  onSubmit,
  onOpenForgotPassword,
}: LoginFormProps) {
  return (
    <>
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
            className={errors.username ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.username && (
            <p className="ml-5 text-xs font-medium text-destructive">{errors.username.message}</p>
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
              onClick={onTogglePassword}
              className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="ml-5 text-xs font-medium text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-sm font-semibold rounded-full"
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
        onClick={onOpenForgotPassword}
        className="w-full text-sm font-semibold flex items-center justify-center gap-2 rounded-full border-border shadow-sm hover:bg-secondary/40"
      >
        <KeyRound size={16} />
        <span>Reset Password</span>
      </Button>

      {/* Public Data Architecture Reference Link */}
      <div className="pt-2 text-center">
        <Link
          to="/database"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-3 rounded-full hover:bg-muted/60"
        >
          <Database size={13} className="text-primary" />
          <span>Xem Kiến trúc Dữ liệu & Sơ đồ ERD (75 Tables) &#8594;</span>
        </Link>
      </div>
    </>
  )
}
