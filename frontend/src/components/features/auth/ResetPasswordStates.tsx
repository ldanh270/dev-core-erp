import { Button } from "@/components/ui/button"

import { Loader2, XCircle } from "lucide-react"

/**
 * Presenter component showing full-screen validation spinner during token verification.
 */
export function ValidatingTokenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Đang xác thực liên kết...</p>
      </div>
    </div>
  )
}

/**
 * Props for InvalidTokenCard component.
 */
export interface InvalidTokenCardProps {
  onBackToLogin: () => void
}

/**
 * Presenter component indicating an expired or non-existent password reset link.
 */
export function InvalidTokenCard({ onBackToLogin }: InvalidTokenCardProps) {
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
        <Button onClick={onBackToLogin} className="w-full rounded-full">
          Quay lại đăng nhập
        </Button>
      </div>
    </div>
  )
}
