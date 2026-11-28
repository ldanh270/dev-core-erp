import { Button } from "@/components/ui/button"

import { AlertTriangle, RefreshCw } from "lucide-react"

/**
 * Presenter component showing loading spinner state for Security Dashboard.
 */
export function SecurityDashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground mt-4">Đang tải dữ liệu bảo mật...</p>
    </div>
  )
}

/**
 * Props for SecurityDashboardError component.
 */
export interface SecurityDashboardErrorProps {
  onRetry: () => void
}

/**
 * Presenter component showing error feedback and retry action for Security Dashboard.
 */
export function SecurityDashboardError({ onRetry }: SecurityDashboardErrorProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
      <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Không thể tải thông tin bảo mật. Vui lòng thử lại sau.
      </p>
      <Button variant="outline" className="mt-4 rounded-full" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  )
}
