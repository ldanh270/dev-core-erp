import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { FormEvent } from "react"

/**
 * Props for ForgotPasswordDialog.
 */
interface ForgotPasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  email: string
  onEmailChange: (val: string) => void
  onSubmit: (e: FormEvent) => void
  isSubmitting: boolean
}

/**
 * Modal dialog prompting users to submit their email for password recovery.
 */
export function ForgotPasswordDialog({
  isOpen,
  onClose,
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
}: ForgotPasswordDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
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
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value)
            }}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-foreground hover:bg-secondary rounded-full text-xs font-semibold cursor-pointer transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-full text-xs font-semibold shadow-sm cursor-pointer transition-colors"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  )
}
