import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { XCircle } from "lucide-react"

/**
 * Presentational skeleton placeholder while application data is being fetched.
 */
export function ApplicationDetailSkeleton() {
  return (
    <div className="container space-y-6 p-8">
      <Skeleton className="h-10 w-1/3 rounded-full" />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="col-span-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

interface ApplicationNotFoundProps {
  onBack: () => void
}

/**
 * Presentational empty state view rendered when the requested application record does not exist.
 */
export function ApplicationNotFound({ onBack }: ApplicationNotFoundProps) {
  return (
    <div className="container flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-4 text-center">
      <XCircle className="size-12 text-destructive" />
      <h2 className="text-xl font-bold text-foreground">Không tìm thấy ứng viên</h2>
      <p className="text-sm text-muted-foreground">
        Hồ sơ ứng tuyển không tồn tại hoặc đã bị xóa.
      </p>
      <Button onClick={onBack} variant="outline" className="rounded-full">
        Quay lại
      </Button>
    </div>
  )
}
