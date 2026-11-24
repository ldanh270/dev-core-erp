import { PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PasswordFormValues } from "@/hooks/profile/useProfileMaster"

import type { FieldErrors, UseFormRegister } from "react-hook-form"

export interface ProfilePasswordSectionProps {
  register: UseFormRegister<PasswordFormValues>
  errors: FieldErrors<PasswordFormValues>
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
  isPending: boolean
  successMsg?: string | null
  errorMsg?: string | null
}

/**
 * Presentational form section for user credential and password modification.
 */
export function ProfilePasswordSection({
  register,
  errors,
  onSubmit,
  onReset,
  isPending,
  successMsg,
  errorMsg,
}: ProfilePasswordSectionProps) {
  return (
    <div className="max-w-xl mx-auto">
      <PageCard>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="border-b border-border/40 pb-3 mb-1">
            <h3 className="text-sm font-bold text-foreground">Đổi mật khẩu tài khoản</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vui lòng điền mật khẩu hiện tại và thiết lập mật khẩu mới.
            </p>
          </div>

          {successMsg && (
            <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="oldPassword">
              Mật khẩu hiện tại <span className="text-destructive">*</span>
            </Label>
            <Input
              id="oldPassword"
              type="password"
              autoComplete="current-password"
              {...register("oldPassword")}
              className={errors.oldPassword ? "border-destructive rounded-full" : "rounded-full"}
            />
            {errors.oldPassword && (
              <p className="text-xs text-destructive mt-1">{errors.oldPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">
              Mật khẩu mới <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
              className={errors.newPassword ? "border-destructive rounded-full" : "rounded-full"}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">
              Nhập lại mật khẩu mới <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={
                errors.confirmPassword ? "border-destructive rounded-full" : "rounded-full"
              }
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              disabled={isPending}
              className="rounded-full cursor-pointer"
            >
              Xóa nhập liệu
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-full cursor-pointer"
            >
              {isPending ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </Button>
          </div>
        </form>
      </PageCard>
    </div>
  )
}
