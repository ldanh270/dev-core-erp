import { EmptyState, PageContainer } from "@/components/common"
import { Button } from "@/components/ui/button"

import { AlertCircle, type LucideIcon } from "lucide-react"

export interface DetailNotFoundProps {
  /** Leading icon for empty state. Defaults to AlertCircle. */
  icon?: LucideIcon
  /** Main headline title */
  title?: string
  /** Explanatory description */
  description?: string
  /** Callback fired when user clicks the back button */
  onBack: () => void
  /** Label for back action button */
  backLabel?: string
}

/**
 * Standardized detail page not found / missing record presenter.
 * Wraps DevCore ERP EmptyState inside PageContainer with a standardized back button.
 */
export function DetailNotFound({
  icon = AlertCircle,
  title = "Không tìm thấy dữ liệu",
  description = "Bản ghi không tồn tại hoặc đã bị xóa.",
  onBack,
  backLabel = "Quay lại",
}: DetailNotFoundProps) {
  return (
    <PageContainer variant="default">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <Button onClick={onBack} variant="outline" className="rounded-full">
            {backLabel}
          </Button>
        }
      />
    </PageContainer>
  )
}
